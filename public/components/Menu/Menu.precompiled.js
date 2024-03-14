(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['Menu.hbs'] = template({"1":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <label>\r\n        <input class=\"floor_btn\" value=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"floor_uuid") : depth0), depth0))
    + "\" type=\"radio\" name=\"radio\" checked/>\r\n        <span>"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"floor_number") : depth0), depth0))
    + "</span>\r\n    </label>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"fieldset\">\r\n"
    + ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"items") : depth0),{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":2,"column":4},"end":{"line":7,"column":13}}})) != null ? stack1 : "")
    + "</div>\r\n";
},"useData":true});
})();