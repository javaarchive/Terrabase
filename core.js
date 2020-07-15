const Endb = require("endb");
var _ = require("lodash");
let jsoning = require("jsoning");
let config = new jsoning("config.json");
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
    enviroment.registerService("fetchPermisson", async function(
      message,
      perms
    ) {
      if (self.perms.has(perms)) {
      } else {
      }
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
      usersDatabase: "sqlite://users.db"
    });
    enviroment.services.registerPermisson("core.admin");
    self.guildsDB = new Endb(self.config.serversDatabase);
    self.categoriesDB = new Endb(self.config.categoriesDatabase);
    self.channelsDB = new Endb(self.config.channelsDatabase);
    self.rolesDB = new Endb(self.config.rolesDatabase);
    self.usersDB = new Endb(self.config.usersDatabase);
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
      let dbObj = {
        get: async function() {
          let template = {};
          template[id] = defaults;
          await getType("category").ensure(levelSnowflake, template);
          return _.defaults(
            defaults,
            await getType("category").get(levelSnowflake)[id]
          );
        },
        set: async function(newVal) {
          let template = {};
          template[id] = defaults;
          await getType("category").ensure(levelSnowflake, template);
          let temp = await getType("category").get(levelSnowflake);
          temp[id] = newVal;
          await getType("category").set(levelSnowflake, temp);
        }
      };
      return dbObj;
    });
    enviroment.registerService("fetchComplete", function(
      levels,
      id,
      defaults = {},
      order = ["guild", "category", "channel","roles","users"]
    ) {
      let data = {};

      for (let i = 0; i < levels.length; i++) {
        data = _.defaults(
          data,
          enviroment.services.fetchDatabase(levels[i], order[i], id, defaults)
        );
      }
    });
  },
  handle: function(data) {
    let message = data.message;
    if (message.content.includes("!terracore!")) {
      console.log("OK!");
      data.appendMessage("Core loaded");
    }
  }
};
module.exports = self;
