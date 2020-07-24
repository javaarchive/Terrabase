const Endb = require("endb");
var _ = require("lodash");
let jsoning = require("jsoning");
let config = new jsoning("config.json");
const utils = require("./utils");
const {patch} = require("./endbpp");
function toBoolean(obj){
  if(obj == undefined || obj == null || obj == false){
    return false;
  }
  return true;
}
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
        return false;
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
      let dbObj = {
        get: async function() {
          let template = {};
          template[id] = defaults;
          await (getType("category")).ensure(levelSnowflake, template);
          return _.defaults(
            defaults,
            await (getType("category")).get(levelSnowflake)[id]
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
    enviroment.registerService("fetchComplete", async function(
      levels,
      id,
      defaults = {},
      order = ["guild", "category", "channel", "rolesCache", "users"]
    ) {
      let data = {};

      for (let i = 0; i < levels.length; i++) {
        if(levels[i] == 1){continue;}
        data = _.defaults(
          data,
          await enviroment.services
            .fetchDatabase(levels[i], order[i], id, defaults)
            .get()
        );
      }
      return data;
    });
    enviroment.registerService("checkPerm", async function(data, perm) {
      //console.log(typeof data.message);
      let rtp = utils.compileRoletoPosition(data.message.channel.guild);
      let fetchLevels = [
        data.message.channel.guild.id,
        data.message.channel.parentID || 1,
        data.message.channel.id,
        data.message.member.roles.length > 0
          ? utils.fetchMaxRole(data.message.member.roles, rtp)
          : 1,
        data.message.author.id + "-" + data.message.guildID
      ];
      let result =
        false || toBoolean((await enviroment.services.fetchComplete(fetchLevels, self.id))[perm]);
      return result;
    });
  },
  handle: async function(data) {
    let message = data.message;
    if (message.content.includes("!terracore!")) {
      console.log("OK!");
      data.appendMessage("Core loaded");
    }
    if (message.content.includes("!terrapermcheck!")) {
      data.appendMessage(
        "`core.admin`: " + (await data.services.checkPerm(data, "core.admin"))
      );
    }
    if(message.content.startsWith("permsconfig")){
      if(message.member.permission.has("administrator")){
        data.appendMessage("You are an admin");
      }else{
        data.appendMessage("Not an admin you have perms number "+message.member.permission.allow);
      }
    }
  }
};
module.exports = self;
