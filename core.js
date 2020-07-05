const Endb = require("endb");
var _ = require("lodash");
let jsoning = require("jsoning");
let config = new jsoning("config.json");
let self = {
  name: "Core",
  id: "core",
  commands: [],
  perms: new Set(),
  start: function(enviroment) {
    enviroment.services.registerService("fetchConfig", function(
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
    enviroment.services.registerService("saveConfig", function(
      moduleid,
      newConfig
    ) {
      config.set(moduleid, newConfig);
    });
    enviroment.services.registerService("registerPermisson", async function(
      name
    ) {
      self.perms.add(name);
    });
    enviroment.services.registerService("checkAllowed", async function(data) {
      let message = data.message;
      let id = data.id;
    });
    self.config = enviroment.services.fetchConfig(self.id, {
      serversDatabase: "sqlite://servers.db",
      categoriesDatabase: "sqlite://categories.db",
      channelsDatabase: "sqlite://channels.db"
    });
    enviroment.services.registerPermisson("core.admin");
    self.serversDB = new Endb(self.config);
    self.categoriessDB = new Endb(self.config);
    self.channelsDB = new Endb(self.config);
    enviroment.services.saveConfig(self.id, self.config);
  },
  handle: function(data) {
    let message = data.message;
  }
};
module.exports = self;
