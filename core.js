// Terragon Core: Required for permissons, config, and other stuff to function

const Endb = require("endb");
const i18next = require("i18next");
var _ = require("lodash");
let jsoning = require("jsoning");
let config = new jsoning(__dirname + "/config.json"); // Load config
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
// Configuration for default values for stuff global between modules
const defaultValuesForGlobals = {
  prefix: "?"
};
function getFetchLevels(message) {
  let rtp = utils.compileRoletoPosition(message.channel.guild);
  let fetchLevels = [
    message.member.roles.length > 0
      ? utils.fetchMaxRole(message.member.roles, rtp)
      : 1,
    message.channel.guild.id,
    message.channel.parentID || 1,
    message.channel.id,
    message.author.id + "-" + message.guildID
  ];
  return fetchLevels;
}
let self = {
  name: "Core",
  id: "core",
  commands: [],
  perms: new Set(),
  dataAccessMode: "blacklist",
  dataAccessBlacklist: [],
  start: async function(environment) {
    environment.i18next = i18next;
    i18next.init({ resources: {} });
    environment.services.i18next = i18next;
    environment.registerService("fetchConfig", async function(
      moduleid,
      defaultConfig = {}
    ) {
      defaultConfig = defaultConfig || {};
      if (!(await config.has(moduleid))) {
        await config.set(moduleid, defaultConfig);
        return defaultConfig;
      }
      return _.defaults(defaultConfig, config.get(moduleid));
    });
    environment.registerService("saveConfig", async function(
      moduleid,
      newConfig
    ) {
      await config.set(moduleid, newConfig);
    });
    environment.registerService("registerPermisson", async function(name) {
      self.perms.add(name);
    });
    environment.registerService("checkAllowed", async function(data) {
      let message = data.message;
      let id = data.id;
    });
    self.config = await environment.services.fetchConfig(self.id, {
      serversDatabase: "sqlite://servers.db",
      categoriesDatabase: "sqlite://categories.db",
      channelsDatabase: "sqlite://channels.db",
      rolesDatabase: "sqlite://roles.db",
      rolesCacheDatabase: "sqlite://rolescache.db",
      usersDatabase: "sqlite://users.db"
    });
    environment.services.registerPermisson("core.admin");
    // Setup dbs
    self.guildsDB = new Endb(self.config.serversDatabase);
    self.categoriesDB = new Endb(self.config.categoriesDatabase);
    self.channelsDB = new Endb(self.config.channelsDatabase);
    self.rolesDB = new Endb(self.config.rolesDatabase);
    self.rolesCacheDB = new Endb(self.config.rolesCacheDatabase);
    self.usersDB = new Endb(self.config.usersDatabase);
    // Upgrade endb with new features
    patch(self.guildsDB);
    patch(self.categoriesDB);
    patch(self.channelsDB);
    patch(self.rolesDB);
    patch(self.rolesCacheDB);
    patch(self.usersDB);
    // Language System
    environment.registerService("addTranslation", function(
      lang,
      module,
      key,
      text
    ) {
      let changes = {};
      changes[key] = text;
      i18next.addResourceBundle(lang, module, changes);
    });
    environment.registerService("getTranslation", async function(
      lang,
      module,
      translationID
    ) {
      await i18next.changeLanguage(lang);
      i18next.setDefaultNamespace(module);
      return i18next.t(translationID);
    });

    environment.services.saveConfig(self.id, self.config);
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
    environment.registerService("fetchDatabase", function(
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
          //console.log("Final "+JSON.stringify(data[id]));
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
    environment.registerService("fetchComplete", async function(
      levels,
      id,
      defaults = {},
      order = ["rolesCache", "guild", "category", "channel", "users"]
    ) {
      // Fetch from all three levels
      let data = defaults;
      //data[id] = defaults;
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
              await environment.services
                .fetchDatabase(levels[i], order[i], id, {})
                .get()
            )
        );
        let overrides = await environment.services
          .fetchDatabase(levels[i], order[i], id, {})
          .get();
        if (!overrides) {
          overrides = {};
        }
        data = _.defaults(data, overrides);
      }
      console.log(JSON.stringify(data));
      return data;
    });
    environment.registerService("checkPerm", async function(data, perm) {
      //console.log(typeof data.message);
      let fetchLevels = getFetchLevels(data.message);
      let result = false;
      console.log(
        "Fetch Complete Data: " +
          JSON.stringify(
            await environment.services.fetchComplete(fetchLevels, "perms")
          )
      );
      if (self.perms.has(perm)) {
        result =
          false ||
          toBoolean(
            (await environment.services.fetchComplete(fetchLevels, "perms"))[
              perm
            ]
          );
        //toBoolean();
      } else {
        result = false;
      }
      return result;
    });
    environment.registerService("getFetchLevelsFromMessage", getFetchLevels);
    // Non-essentials
    environment.registerService("fetchGlobals", async function(data) {
      let fetchLevels = getFetchLevels(data.message);
      return await environment.services
        .fetchComplete(getFetchLevels, "global", defaultValuesForGlobals)
        .get();
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
              data.appendMessage("Permisson `" + args[2] + "` has been set");
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
