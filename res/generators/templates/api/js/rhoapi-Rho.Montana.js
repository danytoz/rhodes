(function ($, rho, rhoUtil) {
    'use strict';

    var module = null;

    var apiReq = rhoUtil.apiReqFor('<%= $cur_module.parents.join(".") %>');

    // === <%= $cur_module.name %> class definition ===

    function <%= $cur_module.name %>(id) {
        if (!(this instanceof <%= $cur_module.name %>)) return new <%= $cur_module.name %>(id);

        this.getId = function () {
            return id;
        };
    };

    // === <%= $cur_module.name %> instance members ===

    <% $cur_module.methods.each do |module_method|
        next if module_method.access == ModuleMethod::ACCESS_STATIC

        params = module_method.params.map do |param|
            "/* #{api_generator_cpp_makeNativeTypeArg(param.type)} */ #{param.name}"
        end.push("/* optional function */ oResult").join(', ')

        actual_method_name = module_method.name
        if actual_method_name.end_with?('=')
            actual_method_name = 'set' + actual_method_name[0].upcase + actual_method_name[1..actual_method_name.length-2]
        end
    %>
        <%= $cur_module.name %>.prototype.<%= actual_method_name %> = function(<%= params %>) {
            return apiReq({
                instanceId: this.getId(),
                args: arguments,
                method: '<%= actual_method_name %>',
                valueCallbackIndex: <%= module_method.params.size %>
            });
        };

    <% end %>

    // === <%= $cur_module.name %> static members ===

    <% $cur_module.constants.each do |module_constant|
        if module_constant.type == MethodParam::TYPE_STRING %>
            <%= $cur_module.name %>.<%= module_constant.name %> = '<%= module_constant.value %>';
        <% else %>
            <%= $cur_module.name %>.<%= module_constant.name %> = <%= module_constant.value %>;
        <% end %>
    <% end %>

    <% $cur_module.methods.each do |module_method|
        next if module_method.access != ModuleMethod::ACCESS_STATIC

        params = module_method.params.map do |param|
            "/* #{api_generator_cpp_makeNativeTypeArg(param.type)} */ #{param.name}"
        end.push("/* optional function */ oResult").join(', ')
    %>
        <%= $cur_module.name %>['<%= module_method.name %>'] = function(<%= params %>) {
            return apiReq({
                instanceId: '0',
                args: arguments,
                method: '<%= module_method.name %>',
                valueCallbackIndex: <%= module_method.params.size %>
            });
        };
    <% end %>

    // === <%= $cur_module.name %> default instance support ===

    <% if $cur_module.is_template_default_instance %>

        <%= $cur_module.name %>['default'] = function () {
            return new <%= $cur_module.name %>(
                apiReq({
                    instanceId: '0',
                    args: [],
                    method:'getDefaultID'
                })
            );
        };

        <%= $cur_module.name %>['getDefaultID'] = function (valueCallback) {
            return apiReq({
                instanceId: '0',
                args: arguments,
                method:'getDefaultID',
                valueCallbackIndex: 0
            });
        };

        <%= $cur_module.name %>['setDefaultID'] = function (id) {
            return apiReq({
                instanceId: '0',
                args: arguments,
                method:'setDefaultID'
            });
        };

    <% end %>

    rhoUtil.namespace('<%= $cur_module.parents.join(".") %>', <%= $cur_module.name %>);

})(jQuery, Rho, Rho.util);