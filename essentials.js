let pendingInput = {};

let self = {
  name: "Essentials Module",
  id: "essentials",
  commands: [],
  start: function(environment) {
    environment.registerService("getPrefix", async function(data) {
      return (await environment.services.fetchGlobals(data))["prefix"] || ".";
    });

    environment.services.botEventService.on("modulebeforeload", async function(
      module
    ) {
      environment.services.registerPermisson(module.id + ".enabled");
    });
    environment.registerService("checkAllowed", async function(data) {
      let allowed = await environment.services.checkPerm(
        data,
        data.id + ".enabled"
      );
      //      console.log("Allow state: " + allowed + " : " + JSON.stringify(data));
      return allowed;
    });
    environment.registerService("checkBot", async function(message) {
      return message.author.bot;
    });
    environment.services.botEventService.on("preexecute", async function(env) {
      console.log("Got preexecute event ", Object.keys(pendingInput));
      if (pendingInput[env.message.guildID + "-" + env.message.member.id]) {
        console.log("Resolving promise for event");
        pendingInput[env.message.guildID + "-" + env.message.member.id][0](
          env.message.content
        );
      }
    });
    environment.registerService("getNextMessageFromUser", async function(data) {
      return new Promise((resolve, reject) => {
        if (pendingInput[data.message.guildID + "-" + data.message.member.id]) {
          pendingInput[
            data.message.guildID + "-" + data.message.member.id
          ][1]();
        }
        pendingInput[data.message.guildID + "-" + data.message.member.id] = [
          resolve,
          reject
        ];
        // ...
      });
    });
    // Create Translations
    environment.services.addTranslation(
      "en",
      self.id,
      "replon",
      "REPL Mode has been enabled"
    );
    environment.services.addTranslation(
      "en",
      self.id,
      "reploff",
      "REPL Mode has been disabled"
    );
    // Aliases
    environment.srvs = environment.services;
    environment._t = environment.services.getTranslation;
  },
  handle: async function(data) {
    let message = data.message;
    let additional = { id: self.id };
    // Check if user has permissons to run this module
    let allowed = data.services.checkAllowed({ ...data, ...additional });

    const prefix = await data.services.getPrefix(data);
    if (
      data.services.isAdmin(message.author) &&
      message.content.startsWith(prefix)
    ) {
      const cmdData = message.content.substring(prefix.length).split(" ");
      data.appendMessage(JSON.stringify(cmdData));
      if (cmdData[0] == "eval-repl") {
        await data.message.channel.createMessage(
          await data.services.getTranslation("en", self.id, "replon")
        );
        let runInput = data.services.getNextMessageFromUser;

        while (true) {
          let inp = await runInput(data);
          //console.log("Evalling Input", inp);
          if (inp.startsWith("exit()")) {
            break;
          }
          try {
            let result = eval(inp);
            await data.message.channel.createMessage("```" + result + "```");
          } catch (ex) {
            await data.message.channel.createMessage(
              "Error: \n ```" + ex + "```"
            );
          }
        }
        data.appendMessage(
          await data.services.getTranslation("en", self.id, "reploff")
        );
      }
    }
    if (!allowed) {
      return;
    }
  }
};
module.exports = self;
