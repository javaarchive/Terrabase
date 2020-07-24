var http = require("http");
var os = require("os");
const Eris = require("eris");
var bot = new Eris(process.env.token);
// Module loader
let modules = [];
// Modules that provide services to other modules need to be regsitered first
modules.push(require("./examplemodule"));
modules.push(require("./core"));
const EventEmitter = require("events");
class BotEventService extends EventEmitter {}
const botEventService = new BotEventService();
bot.on("guildCreate", guild => {
  botEventService.emit("joinguild", guild);
});
bot.on("guildDelete", guild => {
  botEventService.emit("leaveguild", guild);
});
bot.on("guildMemberAdd", (guild, member) => {
  botEventService.emit("guildmemberjoin", { guild: guild, member: member });
});
bot.on("guildMemberRemove", (guild, member) => {
  botEventService.emit("guildmemberleave", { guild: guild, member: member });
});
bot.on("messageDelete", msg => {
  botEventService.emit("messagedelete", msg);
});

let globals = {
  services: {
    botEventService: botEventService
  },
  interfaces: {},
  registerInterface: function(name, service) {
    globals.interfaces[name] = service;
  },
  registerService: function(name, service) {
    globals.services[name] = service;
  }
};
bot.on("ready", () => {
  console.log("System Up");
  botEventService.emit("started");
  for (let i = 0; i < modules.length; i++) {
    try {
      modules[i].start(globals);
    } catch (ex) {
      console.warn("Internal Error whie loading the " + i + "th module " + ex);
      modules.splice(i, 1);
    }
  }
});

bot.on("messageCreate", async msg => {
  if (msg.content === "!speed") {
    let curTime = Date.now();
    await bot.createMessage(msg.channel.id, "Testing my speed");
    await bot.createMessage(
      msg.channel.id,
      "Message sending took " + (Date.now() - curTime) + "ms"
    );
  } else if (msg.content === "!host") {
    let curTime = Date.now();
    bot.createMessage(
      msg.channel.id,
      "Bot is running on " +
        os.hostname() +
        " arch: " +
        os.arch() +
        " cpus: " +
        os.cpus().length +
        " release: " +
        os.release() +
        " platform: " +
        os.platform() +
        " ,host has been up " +
        os.uptime() / 60 +
        " minutes" +
        "\n" +
        " ``` network status " +
        JSON.stringify(os.networkInterfaces()) +
        "\n load average: " +
        os.loadavg() +
        "```"
    );
  } else {
    // Send to processers
    //console.log(require("./utils").compileRoletoPosition(msg.channel.guild.roles));
    let messageQueue = [];
    let extras = {
        messageQueue: messageQueue,
        appendMessage: function(message) {
          messageQueue.push(message);
        },
      message: msg,
      client: bot
      };
    let finalenv = { ...extras, ...globals };
    for (let i = 0; i < modules.length; i++) {
      await modules[i].handle(finalenv);
    }
    console.log("Finished executing modules");
    if(finalenv.messageQueue.length > 0){
      bot.createMessage(msg.channel.id, finalenv.messageQueue.join("\n"));
    }
  }
});
bot.on("ready", function(){
  console.log("Connected");
})
bot.connect();
//create a new server object:
http
  .createServer(function(req, res) {
    res.write("Server is ok :D"); //write a response to the client
    res.end(); //end the response
  })
  .listen(8080); //the server object listens on port 8080
console.log("All systems have loaded");