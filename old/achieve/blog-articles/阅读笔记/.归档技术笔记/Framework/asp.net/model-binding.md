# Model Binding

Research [Model Binding](https://docs.microsoft.com/en-us/aspnet/core/mvc/models/model-binding) in ASP.Net Core
<!--more-->

## Route

1. Receive HTTP Request
2. Router finds related action of controller According URL and URL Template, **URL route are not case sensitive**
3. Model Binding and then route to exact action of controller according to action parameters

## Source Of Model Binding in Request

Model Binding will try to bind request data to the action parameters by **name**.

Default Data source of Model Binding in order:
1. Form values, form values that go in HTTP request using POST method
2. Route values, matched values from comparing URL with URL Template of Routing
3. Query strings, query string part of the URI

All of data are stored as **name-value pairs**.

For customized class, Model binding looks for the pattern **parameter_name.property_name** 
and bind values to **public settable properties**.

Customized class for model binding must have a **public default constructor** and members to be **public settable properties**.

For Collections, model binding looks for matches to **parameter_name[index] or [index]**

For Dictionary, model binding looks for matches to **parameter_name[key] or [key]**

If binding fails, MVC does not throw an error, check if binding success by querying **ModelState.IsValid** property.

Special data source
- IFormFile, IEnumerable<IFormFile>: One or more uploaded files that are part of the HTTP request.
- CancelationToken: Used to cancel activity in asynchronous controllers.

### Control model binding behavior from different data source

- [BindRequired]: This attribute adds a model state error if binding cannot occur.
- [BindNever]: Tells the model binder to never bind to this parameter.
- [FromHeader], [FromQuery], [FromRoute], [FromForm]: Use these to specify the exact binding source you want to apply.
- [FromServices]: This attribute uses dependency injection to bind parameters from services.
- [FromBody]: Use the configured formatters to bind data from the request body. 
The formatter is selected based on content type of the request. **There can be at most one parameter per action.**
- [ModelBinder]: Used to override the default model binder, binding source and name.

Once model binding is complete, Validation occurs. 

Many useful validation attributes can be found in the **System.ComponentModel.DataAnnotations** namespace.