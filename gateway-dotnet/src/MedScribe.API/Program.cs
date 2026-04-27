using System.Text;
using MedScribe.API.Contratos;
using MedScribe.API.Datos.DAO;
using MedScribe.API.Intermediarios;
using MedScribe.API.Servicios;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

var constructorDeAplicacion = WebApplication.CreateBuilder(args);

constructorDeAplicacion.Services.AddControllers()
    .ConfigureApiBehaviorOptions(opciones =>
    {
        opciones.SuppressModelStateInvalidFilter = false;
    });

constructorDeAplicacion.Services.AddOpenApi();

constructorDeAplicacion.Services.AddScoped<ProveedorContextoClinica>();
constructorDeAplicacion.Services.AddSingleton<ServicioContrasenas>();
constructorDeAplicacion.Services.AddSingleton<ServicioJwt>();
constructorDeAplicacion.Services.AddScoped<IUsuarioDAO, UsuarioDAO>();
constructorDeAplicacion.Services.AddScoped<IPacienteDAO, PacienteDAO>();
constructorDeAplicacion.Services.AddScoped<IConsultaDAO, ConsultaDAO>();
constructorDeAplicacion.Services.AddScoped<IDocumentoDAO, DocumentoDAO>();
constructorDeAplicacion.Services.AddScoped<ISuscripcionDAO, SuscripcionDAO>();
constructorDeAplicacion.Services.AddScoped<IClinicaDAO, ClinicaDAO>();
constructorDeAplicacion.Services.AddScoped<IRolDAO, RolDAO>();
constructorDeAplicacion.Services.AddScoped<IUsuarioDeClinicaDAO, UsuarioDeClinicaDAO>();

constructorDeAplicacion.Services.AddHttpClient<ClienteServicioIA>();

var seccionJwt = constructorDeAplicacion.Configuration.GetSection("Jwt");
var secretoJwt = seccionJwt["Secreto"];
if (string.IsNullOrWhiteSpace(secretoJwt))
    throw new InvalidOperationException("Falta la configuracion Jwt:Secreto");
var llaveJwt = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretoJwt));

constructorDeAplicacion.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opciones =>
    {
        opciones.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = seccionJwt["Emisor"],
            ValidAudience = seccionJwt["Audiencia"],
            IssuerSigningKey = llaveJwt,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

constructorDeAplicacion.Services.AddAuthorization(opciones =>
{
    opciones.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

constructorDeAplicacion.Services.AddCors(opciones =>
{
    opciones.AddPolicy("PermitirClienteWeb", politica =>
    {
        politica.WithOrigins(
                constructorDeAplicacion.Configuration.GetSection("OrigenesPermitidos").Get<string[]>()
                ?? ["http://localhost:3000"])
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var aplicacion = constructorDeAplicacion.Build();

aplicacion.UseMiddleware<ManejadorGlobalDeExcepciones>();

if (aplicacion.Environment.IsDevelopment())
    aplicacion.MapOpenApi();

aplicacion.UseCors("PermitirClienteWeb");
aplicacion.UseAuthentication();
aplicacion.UseAuthorization();
aplicacion.UseMiddleware<MiddlewareTenancyDeClinica>();
aplicacion.MapControllers();
aplicacion.Run();
