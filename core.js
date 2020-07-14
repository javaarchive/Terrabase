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
    enviroment.registerService("saveConfig", function(
      moduleid,
      newConfig
    ) {
      config.set(moduleid, newConfig);
    });
    enviroment.registerService("registerPermisson", async function(
      name
    ) {
      self.perms.add(name);
    });
    enviroment.registerService("fetchPermisson", async function(
      message, perms
    ) {
      if(self.perms.has(perms)){
        
      }else{
        
      }
    });
    enviroment.registerService("checkAllowed", async function(data) {
      let message = data.message;
      let id = data.id;
    });
    self.config = enviroment.services.fetchConfig(self.id, {
      serversDatabase: "sqlite://servers.db",
      categoriesDatabase: "sqlite://categories.db",
      channelsDatabase: "sqlite://channels.db"
    });
    enviroment.services.registerPermisson("core.admin");
    self.guildsDB = new Endb(self.config);
    self.categoriessDB = new Endb(self.config);
    self.channelsDB = new Endb(self.config);
    enviroment.services.saveConfig(self.id, self.config);
    function getType(type){
      if(type == "guild"){
        return self.guildsDB;
      }
      if(type == "category"){
        return self.categoriesDB;
      }
      if(type == "channel"){
        return self.channelsDB;
      }
      return undefined;
    }
    enviroment.registerService("fetchDatabase", function(levelSnowflake ,level, id, defaults = {}){
      let dbObj = {
        get: async function(){
          return _.defaults(defaults,await getType("category").get(levelSnowflake)[id]);
        },set:async function(newVal){
          await getType("category").set(levelSnowflake[id], newVal);
        }
      };
      return dbObj;
    });
  },
  handle: function(data) {
    let message = data.message;
    if(message.content.includes("!terracore!")){
      console.log("OK!");
      data.appendMessage("Core loaded");
    }
  }
};
module.exports = self;
