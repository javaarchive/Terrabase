const self = {
  compileRoletoPosition: function(roles){
    //console.log(roles);
    return roles; // Apparently collection is already a map
  },
  fetchMaxRole: function(roleList,roles){
    let bestRole = null;
    let bestRoleLevel = roles;
    return self.sortRoles(roleList, roles)[roleList.length - 1];
  },
  sortRoles: function(roleList, roles){
    roleList.sort((a, b) => (a.position > b.position) ? 1 : -1);
    return roleList;
  }
}
module.exports = self;