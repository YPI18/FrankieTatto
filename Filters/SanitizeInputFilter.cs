using Ganss.Xss;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Reflection;

namespace FrankieTattoo.Api.Filters;

public class SanitizeInputFilter : IActionFilter
{
    private readonly HtmlSanitizer _sanitizer;

    public SanitizeInputFilter()
    {
        _sanitizer = new HtmlSanitizer();
    }

    public void OnActionExecuting(ActionExecutingContext context)
    {
        var keys = context.ActionArguments.Keys.ToList();
        foreach (var key in keys)
        {
            var arg = context.ActionArguments[key];
            if (arg is string stringValue)
            {
                context.ActionArguments[key] = _sanitizer.Sanitize(stringValue);
            }
            else if (arg != null)
            {
                SanitizeProperties(arg);
            }
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // No action needed after execution
    }

    private void SanitizeProperties(object obj)
    {
        if (obj == null) return;

        var type = obj.GetType();
        
        // Evitamos intentar sanitizar tipos primitivos o clases del sistema
        if (type.IsPrimitive || type.Namespace?.StartsWith("System") == true || type.Namespace?.StartsWith("Microsoft") == true)
            return;

        var properties = type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p => p.CanRead && p.CanWrite && p.PropertyType == typeof(string));

        foreach (var property in properties)
        {
            var value = (string?)property.GetValue(obj);
            if (!string.IsNullOrEmpty(value))
            {
                var sanitizedValue = _sanitizer.Sanitize(value);
                if (value != sanitizedValue)
                {
                    property.SetValue(obj, sanitizedValue);
                }
            }
        }
    }
}
