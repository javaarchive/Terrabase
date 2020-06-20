let self = {
  name: "Example command",
  id: "examplecmd",
  commands: [],
  start: function(enviroment) {
    enviroment.services.botEventService.on("memberJoin", function(data) {});
  },
  handle: function(data) {
    let message = data.message;
    let allowed = data.services.checkAllowed({
      message: message,
      id: self.id,
      name: self.name
    });
    if (!allowed) {
      return;
    }
  }
};
module.exports = self;
