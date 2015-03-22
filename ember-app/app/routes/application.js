import Serializable from 'app/mixins/serializable';
import SocketMixin from 'app/mixins/socket';
import Ember from 'ember';
import Repo from 'app/models/repo';



var ApplicationRoute = Ember.Route.extend({
  actions: {
    sessionErrorHandler: function(){
      this.render("login", { into: 'application', outlet: 'modal' });
    },
    loading: function(){
      if(this.router._activeViews.application){
        this.render("loading",{ "into" : "application", "outlet" : "loading"});
        this.router.one('didTransition', function() {
          this.render("empty",{ "into" : "application", "outlet" : "loading"});
        }.bind(this));
        return true;
      }
      this.render("loading");
    },
    toggleSidebar: function(){
      this.controllerFor("application").toggleProperty("isSidebarOpen");
    },
    openModal: function (view){
      this.render(view, {
        into: "application",
        outlet: "modal"
      })
    },
    closeModal: function() {
      animateModalClose().then(function() {
        this.render('empty', {
          into: 'application',
          outlet: 'modal'
        });
      }.bind(this));
    },
    clearFilters: function(){
      this.controllerFor("filters").send("clearFilters");
      this.controllerFor("assignee").send("clearFilters");
      this.controllerFor("search").send("clearFilters");
    }
  },
  model: function () {
    return Ember.Deferred.promise(function(p){
       Ember.run.once(function(){
        console.log("TODO: fix this call to App")
        var repo = App.get("repo");
        p.resolve(Repo.create(repo));
       })
    });
  },
  setupController: function(controller){
    this._super.apply(this, arguments);
    SocketMixin.apply(controller);
    controller.setUpSocketEvents();
    $(document).ajaxError(function(event, xhr){
      if(loggedIn && xhr.status == 404){
        this.send("sessionErrorHandler");
      }
    }.bind(this));
  }
})

export default ApplicationRoute;
