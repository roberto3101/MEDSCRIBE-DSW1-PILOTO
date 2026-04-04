using MedScribe.API.Contratos;
using MedScribe.API.Datos.DAO;
using MedScribe.API.Intermediarios;
using MedScribe.API.Servicios;

var constructorDeAplicacion = WebApplication.CreateBuilder(args);

constructorDeAplicacion.Services.AddControllers()
    .ConfigureApiBehaviorOptions(opciones =>
    {
        opciones.SuppressModelStateInvalidFilter = false;
    });

constructorDeAplicacion.Services.AddOpenApi();

constructorDeAplicacion.Services.AddScoped<ProveedorContextoClinica>();
constructorDeAplicacion.Services.AddScoped<IUsuarioDAO, UsuarioDAO>();
constructorDeAplicacion.Services.AddScoped<IPacienteDAO, PacienteDAO>();
constructorDeAplicacion.Services.AddScoped<IConsultaDAO, ConsultaDAO>();
constructorDeAplicacion.Services.AddScoped<IDocumentoDAO, DocumentoDAO>();
constructorDeAplicacion.Services.AddScoped<ISuscripcionDAO, SuscripcionDAO>();
constructorDeAplicacion.Services.AddScoped<IClinicaDAO, ClinicaDAO>();
constructorDeAplicacion.Services.AddScoped<IRolDAO, RolDAO>();
constructorDeAplicacion.Services.AddScoped<IUsuarioDeClinicaDAO, UsuarioDeClinicaDAO>();

constructorDeAplicacion.Services.AddHttpClient<ClienteServicioIA>();

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
aplicacion.MapControllers();
aplicacion.Run();
