// SideBar.js
// SideBar Component. With 'side-bar' custom tag.

var data = {items:[
  {'text': "Item", 'ref': "#", 'style': "sub-icon glyphicon glyphicon-link"},
  {'text': "Item", 'ref': "#", 'style': "sub-icon glyphicon glyphicon-link"},
  {'text': "Item", 'ref': "#", 'style': "sub-icon glyphicon glyphicon-link"}
  ],
  menu: {'text': "Menu", 'ref': "#"},
  status: "active"
};

export default {
  name: 'sidebar',
  data: function () {
    return data;
  },
  methods: {
    toggleMenu(){
      this.status = this.status === "active" ? "inactive" : "active";
    }
  }
}


