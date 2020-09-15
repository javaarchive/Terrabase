// Terragon Core: Required for permissons, config, and other stuff to function

const Endb = require("endb");
var _ = require("lodash");
let jsoning = require("jsoning");
let config = new jsoning("config.json");
const utils = require("./utils");
const { patch } = require("./endbpp");
function toBoolean(obj) {
  if (obj == undefined || obj == null || obj == false) {
    return false;
  }
  return true;
}
const textToMode = {
  none: undefined,
  false: false,
  true: true
};
let self = {
  name: "Core",
  id: "core",
  commands: [],
  perms: new Set(),
  dataAccessMode: "blacklist",
  dataAccessBlacklist: [],
  start: function(enviroment) {
    enviroment.registerService("fetchConfig", function(
      moduleid,
      defaultConfig = {}
    ) {
      defaultConfig = defaultConfig || {};
      if (!config.has(moduleid)) {
        config.set(moduleid, defaultConfig);
        return defaultConfig;
      }
      return _.defaults(defaultConfig, config.get(moduleid));
    });
    enviroment.registerService("saveConfig", function(moduleid, newConfig) {
      config.set(moduleid, newConfig);
    });
    enviroment.registerService("registerPermisson", async function(name) {
      self.perms.add(name);
    });
    enviroment.registerService("checkAllowed", async function(data) {
      let message = data.message;
      let id = data.id;
    });
    self.config = enviroment.services.fetchConfig(self.id, {
      serversDatabase: "sqlite://servers.db",
      categoriesDatabase: "sqlite://categories.db",
      channelsDatabase: "sqlite://channels.db",
      rolesDatabase: "sqlite://roles.db",
      rolesCacheDatabase: "sqlite://rolescache.db",
      usersDatabase: "sqlite://users.db"
    });
    enviroment.services.registerPermisson("core.admin");
    self.guildsDB = new Endb(self.config.serversDatabase);
    self.categoriesDB = new Endb(self.config.categoriesDatabase);
    self.channelsDB = new Endb(self.config.channelsDatabase);
    self.rolesDB = new Endb(self.config.rolesDatabase);
    self.rolesCacheDB = new Endb(self.config.rolesCacheDatabase);
    self.usersDB = new Endb(self.config.usersDatabase);
    patch(self.guildsDB);
    patch(self.categoriesDB);
    patch(self.channelsDB);
    patch(self.rolesDB);
    patch(self.rolesCacheDB);
    patch(self.usersDB);
    enviroment.services.saveConfig(self.id, self.config);
    function getType(type) {
      if (type == "guild") {
        return self.guildsDB;
      }
      if (type == "category") {
        return self.categoriesDB;
      }
      if (type == "channel") {
        return self.channelsDB;
      }
      if (type == "roles") {
        return self.rolesDB;
      }
      if (type == "rolesCache") {
        return self.rolesCacheDB;
      }
      if (type == "users") {
        return self.usersDB;
      }
      return undefined;
    }
    enviroment.registerService("fetchDatabase", function(
      levelSnowflake,
      level,
      id,
      defaults = {}
    ) {
      if (typeof levelSnowflake == "number") {
        levelSnowflake = levelSnowflake.toString();
      }
      let dbObj = {
        get: async function() {
          let template = {};
          template[id] = defaults;
          await getType(level).ensure(levelSnowflake, template);
          console.log(
            level +
              " " +
              levelSnowflake +
              " " +
              JSON.stringify(await getType(level).get(levelSnowflake)) +
              " requested " +
              id
          );
          let data = await getType(level).get(levelSnowflake);
          if (!data[id]) {
            data[id] = template;
          }
          return data[id];
        },
        set: async function(newVal) {
          let template = {};
          template[id] = defaults;
          await getType(level).ensure(levelSnowflake, template);
          let temp = await getType(level).get(levelSnowflake);
          temp[id] = newVal;
          await getType(level).set(levelSnowflake, temp);
        }
      };
      return dbObj;
    });
    enviroment.registerService("fetchComplete", async function(
      levels,
      id,
      defaults = {},
      order = ["rolesCache", "guild", "category", "channel", "users"]
    ) {
      let data = {};
      console.log("Using id " + id);
      for (let i = 0; i < levels.length; i++) {
        if (levels[i] == 1) {
          continue;
        }
        console.log(
          "stage " +
            order[i] +
            " id: " +
            levels[i] +
            " : " +
            JSON.stringify(
              await enviroment.services
                .fetchDatabase(levels[i], order[i], id, defaults)
                .get()
            )
        );
        let overrides = await enviroment.services
          .fetchDatabase(levels[i], order[i], id, defaults)
          .get();
        if (!overrides) {
          overrides = {};
        }
        data = _.defaults(data, overrides);
      }
      return data;
    });
    enviroment.registerService("checkPerm", async function(data, perm) {
      //console.log(typeof data.message);
      let rtp = utils.compileRoletoPosition(data.message.channel.guild);
      let fetchLevels = [
        data.message.member.roles.length > 0
          ? utils.fetchMaxRole(data.message.member.roles, rtp)
          : 1,
        data.message.channel.guild.id,
        data.message.channel.parentID || 1,
        data.message.channel.id,
        data.message.author.id + "-" + data.message.guildID
      ];
      let result = false;
      console.log(
        "Fetch Complete Data: " +
          JSON.stringify(
            await enviroment.services.fetchComplete(fetchLevels, "perms")
          )
      );
      if (self.perms.has(perm)) {
        result =
          false ||
          toBoolean(
            (await enviroment.services.fetchComplete(fetchLevels, "perms"))[
              perm
            ]
          );
        //toBoolean();
      } else {
        result = false;
      }
      return result;
    });
  },
  handle: async function(data) {
    let message = data.message;
    if (message.content.includes("!terracore!")) {
      console.log("OK!");
      data.appendMessage("Core loaded");
    }
    if (
      message.content.includes("!terrapermcheck!") ||
      message.content.includes("!tpc!")
    ) {
      data.appendMessage(
        "`core.admin`: " + (await data.services.checkPerm(data, "core.admin"))
      );
    }
    if (message.content.startsWith("permsconfig")) {
      if (message.member.permission.has("administrator")) {
        data.appendMessage("You have sufficent permissons: welcome!");
        if (message.content.length == "permsconfig".length) {
          data.appendEmbed({
            title: "Permisson Configurator",
            description:
              "It's a complex system but it's easy to learn how it works",
            url: "https://discordapp.com",
            color: 11111111,
            thumbnail: {
              url: "https://cdn.discordapp.com/embed/avatars/0.png"
            },
            author: {
              name: "Terrabase Permissons Guide",
              url: "https://github.com/javaarchive/Terrabase",
              icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
            },
            fields: [
              {
                name: "You already know how to use it",
                value:
                  "It's just like discord's permissons system except the priorties are a bit different. First guild level permissons are applied then the category permissons override those if you use categories. Then the channel level permissons are applied and finally the role level and user level permissons are applied. This order will defintley change in the future because I think roles should be somewhere else. "
              }
            ]
          });
        } else {
          let args = message.content
            .substring("permsconfig".length + 1)
            .split(" ");
          try {
            if (args.length < 4) {
              throw "Not enough arguments";
            }
            if (!["false", "true", "none"].includes(args[3])) {
              throw "Argument 4 is not valid must be one of false or true or none";
            }
            if (isNaN(args[1])) {
              throw "Argument 2 is not a number/snowflake";
            }
            if (!["category", "channel", "role", "guild"].includes(args[0])) {
              throw "Argument 1 is not valid must be one of false or true or none";
            }
            if (args[0] == "role") {
              data.appendMessage(
                "Note: you must run the role compilation tool to save role permissons to a ready to use format. "
              );
            }
            //getType(args[0]).set(args[1], args[3]);
            if (self.perms.has(args[2])) {
              let permsMap = data.services.fetchDatabase(
                args[1],
                args[0],
                "perms",
                {}
              );
              let temp = await permsMap.get();
              temp[args[2]] = textToMode[args[3]];
              console.log(
                "Setting new value of temp to " + JSON.stringify(temp)
              );
              await permsMap.set(temp);
            } else {
              throw "Permisson not registered";
            }
          } catch (ex) {
            const errorEmbed = {
              title: "Internal Error",
              description:
                "This could have happended becuase something you typed was invalid or it could have been a problem with our code. ",
              color: 15158332,
              fields: [
                {
                  name: "Info: ",
                  value: "Error: " + ex
                }
              ]
            };

            data.appendEmbed(errorEmbed);
          }
        }
      } else {
        data.appendMessage(
          "Not an admin you have perms number " +
            message.member.permission.allow
        );
      }
    }
  }
};
module.exports = self;
