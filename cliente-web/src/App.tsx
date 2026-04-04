import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProveedorAutenticacion } from './contextos/ContextoAutenticacion'
import PlantillaPublico from './componentes/plantilla/PlantillaPublico'
import PlantillaAutenticado from './componentes/plantilla/PlantillaAutenticado'
import RutaProtegida from './rutas/RutaProtegida'
import PaginaInicioSesion from './paginas/inicio-sesion/PaginaInicioSesion'
import PaginaRegistroClinica from './paginas/registro-clinica/PaginaRegistroClinica'
import PaginaPanel from './paginas/panel/PaginaPanel'
import PaginaPacientes from './paginas/pacientes/PaginaPacientes'
import PaginaNuevaConsulta from './paginas/nueva-consulta/PaginaNuevaConsulta'
import PaginaConsultas from './paginas/consultas/PaginaConsultas'
import PaginaDetalleConsulta from './paginas/consultas/PaginaDetalleConsulta'
import PaginaDocumentos from './paginas/documentos/PaginaDocumentos'
import PaginaConfiguracionDocumentos from './paginas/configuracion-documentos/PaginaConfiguracionDocumentos'
import PaginaPerfil from './paginas/perfil/PaginaPerfil'
import PaginaUsuariosClinica from './paginas/usuarios-clinica/PaginaUsuariosClinica'
import PaginaRoles from './paginas/roles/PaginaRoles'

export default function App() {
  return (
    <BrowserRouter>
      <ProveedorAutenticacion>
        <Routes>
          <Route element={<PlantillaPublico />}>
            <Route path="/iniciar-sesion" element={<PaginaInicioSesion />} />
            <Route path="/registrar-clinica" element={<PaginaRegistroClinica />} />
          </Route>

          <Route element={<RutaProtegida><PlantillaAutenticado /></RutaProtegida>}>
            <Route path="/panel" element={<PaginaPanel />} />
            <Route path="/pacientes" element={<PaginaPacientes />} />
            <Route path="/consultas" element={<PaginaConsultas />} />
            <Route path="/consultas/nueva" element={<PaginaNuevaConsulta />} />
            <Route path="/consultas/:id" element={<PaginaDetalleConsulta />} />
            <Route path="/documentos" element={<PaginaDocumentos />} />
            <Route path="/configuracion-documentos" element={<PaginaConfiguracionDocumentos />} />
            <Route path="/usuarios-clinica" element={<PaginaUsuariosClinica />} />
            <Route path="/roles" element={<PaginaRoles />} />
            <Route path="/perfil" element={<PaginaPerfil />} />
          </Route>

          <Route path="*" element={<Navigate to="/iniciar-sesion" replace />} />
        </Routes>
      </ProveedorAutenticacion>
    </BrowserRouter>
  )
}
