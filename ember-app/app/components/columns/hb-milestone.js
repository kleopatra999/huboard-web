import Ember from "ember";
import HbColumn from "../columns/hb-column";
import MilestoneSubscriptions from 'app/mixins/subscriptions/milestone';
import Messaging from 'app/mixins/messaging';

var HbMilestoneComponent = HbColumn.extend(
  MilestoneSubscriptions, Messaging, {
  classNames: ["milestone"],
  classNameBindings:["isFirstColumn:no-milestone"],
  isTaskColumn: false,

  sortedIssues: function () {
    var issues = this.get("issues")
      .filter(this.get("model.filterBy").bind(this))
      .filter((i)=> {
        if(i.data.state === "closed"){ return !i.get("isArchived"); }
        return true;
      })
      .sort(this.sortStrategy);
    return issues;
  }.property("issues.@each.{milestoneOrder,milestoneTitle}"),
  sortStrategy: function(a,b){
    if(a.data._data.milestone_order === b.data._data.milestone_order){
      if(a.repo.data.repo.full_name === b.repo.data.repo.full_name){
        return a.data.number - b.data.number;
      }
      return a.repo.data.repo.full_name - b.repo.data.repo.full_name;
    }
    return a.data._data.milestone_order - b.data._data.milestone_order;
  },
  moveIssue: function(issue, order, cancelMove){
    if(!this.get("model.milestone")){
      return this.assignMilestone(issue, order, { data: null});
    }

    var findMilestone = this.findMilestone(issue.repo);
    var milestone = this.get("model.milestones").find(findMilestone);
    if(!milestone){
      return this.handleMissingMilestone(issue, order, cancelMove);
    }
    this.assignMilestone(issue, order, milestone);
  },
  assignMilestone: function(issue, order, milestone){
    this.get("sortedIssues").removeObject(issue);
    var _self = this;
    Ember.run.schedule("afterRender", _self, function(){
      issue.assignMilestone(order, milestone.data);
    });
  },
  findMilestone: function(a){
    return function(b){
      return _.isEqual(a.data.repo.full_name, b.repo.data.repo.full_name);
    };
  },
  handleMissingMilestone: function(issue, order, cancelMove){
    var _self = this;
    this.attrs.createMilestoneOrAbort({
      card: issue,
      column: _self.get("model"),
      onAccept: function(milestone){
        //FIXME: not real happy about mutating here
        Ember.run.once(() => {
          _self.get("model.milestones").pushObject(milestone);
          _self.moveIssue(issue, order);
        });
      },
      onReject: function(){
        cancelMove();
      }
    });
  },
  isCreateVisible: true,
  topOrderNumber: function(){
    var issues = this.get("issues")
      .filter(function(i) { return !i.get("isArchived");})
      .sort(this.sortStrategy);
    var first = this.get("issues")
      .filter(function(i) { return !i.get("isArchived");})
      .sort(function (a, b){
        return a.data._data.order - b.data._data.order;
      }).get("firstObject");
    if(issues.length){
      var milestone_order = this.cardMover.moveToTop(issues.get("firstObject.data"));
      var order = { milestone_order: milestone_order};
      if(first){
        order.order = this.cardMover.moveToTop(first.data);
      }
      return order;
    } else {
      if(first){
        return { order: this.cardMover.moveToTop(first.data) };
      }
      return {};
    }
  }.property("sortedIssues.[]"),
  isFirstColumn: function(){
    return !this.get("model.milestone");
  }.property("model.milestone"),
  isCollapsed: Ember.computed({
    get: function(){
      return this.get("settings.milestoneColumn" + this.get("model.milestone.number") + "Collapsed");
    },
    set: function(key, value){
      this.set("settings.milestoneColumn" + this.get("model.milestone.number") + "Collapsed", value);
      return value;
    }
  }).property(),
});

export default HbMilestoneComponent;
