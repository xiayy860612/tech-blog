# Serializer

Research [Serializer](https://docs.microsoft.com/en-us/aspnet/core/mvc/models/formatting) in ASP.Net Core.
<!--more-->

Content serialization is specifies in [**Accept Header**](https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html).
If server has a formatter inherits from **IOutputFormatter** that can produce a response in the requested format, 
the result will be returned in the client-preferred format.

Configure formatters in **Startup.ConfigureServices**.

## Custom Formatters

Steps to create and use a custom formatter:

- Create an output formatter class if you want to serialize data to send to the client.
- Create an input formatter class if you want to deserialize data received from the client.
- Add instances of **InputFormatters** and **OutputFormatters** collections in MvcOptions.

    services.AddMvc(options =>
    {
        options.InputFormatters.Add(new CustomInputFormatter());
        options.OutputFormatters.Add(new CustomOutputFormatter());
    });

### Create a formatter

- Derive the class from **IInputFormatter** or **IOutputFormatter**
    + binary data, InputFormatter or OutputFormatter
    + text data, TextInputFormatter or TextOutputFormatter
- Specify valid media types which will be used in **Accept Header** and encodings in the constructor
- Override CanReadType/CanWriteType methods to check if formatter could be used
- Override ReadRequestBodyAsync/WriteResponseBodyAsync methods to execute serializer process