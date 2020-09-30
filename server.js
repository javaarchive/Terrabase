var http = require("http");
var os = require("os");
const Eris = require("eris");
var bot = new Eris(process.env.token);
// Module loader
let modules = [];
// Modules that provide services to other modules need to be regsitered first
modules.push(require("./core"));
modules.push(require("./examplemodule"));
//moduleNames = ["./core","./c"];

// Main Code

(async function() {
  const EventEmitter = require("event-chains");
  class BotEventService extends EventEmitter {}
  const botEventService = new BotEventService();
  bot.on("guildCreate", async guild => {
    await botEventService.emit("joinguild", guild);
  });
  bot.on("guildDelete", async guild => {
    await botEventService.emit("leaveguild", guild);
  });
  bot.on("guildMemberAdd", async (guild, member) => {
    await botEventService.emit("guildmemberjoin", {
      guild: guild,
      member: member
    });
  });
  bot.on("guildMemberRemove", async (guild, member) => {
    await botEventService.emit("guildmemberleave", {
      guild: guild,
      member: member
    });
  });
  bot.on("messageDelete", async msg => {
    await botEventService.emit("messagedelete", msg);
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
    },
    workQueue: []
  };
  bot.on("ready", async () => {
    console.log("System Up");
    botEventService.emit("started");
    for (let i = 0; i < modules.length; i++) {
      try {
        await botEventService.emit("modulebeforeload", modules[i]);
        await modules[i].start(globals);
        await botEventService.emit("moduleafterload", modules[i]);
      } catch (ex) {
        console.warn(
          "Internal Error whie loading the " + i + "th module " + ex
        );
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
      if (msg.mentions.length == 1) {
        if (msg.mentions[0].id == bot.user.id) {
          let cmd = msg.content.substring(bot.user.id.toString().length + 4);
          //console.log(cmd);
          if (cmd[0] == " ") {
            cmd = cmd.substring(1);
          }
          let cmdParts = cmd.split(" ");
          
          if (cmdParts[0] == "listmodules") {
            bot.createMessage(msg.channel.id, "```"+modules.map(x => x.id).join(",") + "```");
          }
          //console.log(cmd);
        }
      }
      //console.log(require("./utils").compileRoletoPosition(msg.channel.guild.roles));
      let messageQueue = [];
      let embedQueue = [];
      let extras = {
        messageQueue: messageQueue,
        embedQueue: embedQueue,
        appendMessage: function(message) {
          messageQueue.push(message);
        },
        appendEmbed: function(embed) {
          embedQueue.push(embed);
        },
        message: msg,
        client: bot
      };
      let finalenv = { ...extras, ...globals };
      for (let i = 0; i < modules.length; i++) {
        await modules[i].handle(finalenv);
      }
      console.log("Finished executing modules");
      if (finalenv.messageQueue.length > 0) {
        bot.createMessage(msg.channel.id, {
          content: finalenv.messageQueue.join("\n"),
          embed: embedQueue[0]
        });
      }
    }
  });
  bot.on("ready", function() {
    console.log("Connected");
  });
  bot.connect();
  //create a new server object:
  http
    .createServer(function(req, res) {
      res.write("Server is ok :D"); //write a response to the client
      res.end(); //end the response
    })
    .listen(8080); //the server object listens on port 8080
  console.log("All systems have loaded");
})().then(console.log);
