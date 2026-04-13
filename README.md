# 📱 Viáticos App

Una aplicación móvil inteligente para la gestión automatizada de gastos empresariales que digitaliza comprobantes y facturas usando OCR e Inteligencia Artificial.

[![Expo](https://img.shields.io/badge/Expo-49.0.0-blue.svg)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.72.6-green.svg)](https://reactnative.dev/)
[![React Navigation](https://img.shields.io/badge/React%20Navigation-6.x-purple.svg)](https://reactnavigation.org/)
[![React Native Paper](https://img.shields.io/badge/React%20Native%20Paper-5.x-orange.svg)](https://reactnativepaper.com/)

## 🚀 Características Principales

### 📸 **Captura Inteligente**
- **OCR Avanzado**: Extrae automáticamente datos de comprobantes y facturas
- **Clasificación IA**: Categoriza gastos automáticamente (Alimentación, Transporte, Alojamiento)
- **Múltiples fuentes**: Cámara en tiempo real, galería de fotos, o entrada manual

### 📊 **Gestión Completa**
- **Dashboard intuitivo**: Vista general de gastos por gira y categoría
- **Historial detallado**: Búsqueda y filtrado avanzado de gastos
- **Gestión de giras**: Asignación automática de gastos a viajes empresariales
- **Reportes automáticos**: Generación de reportes de gastos

### 🎨 **Experiencia de Usuario**
- **Diseño moderno**: UI/UX basado en Material Design 3
- **Tema personalizable**: Colores corporativos consistentes
- **Navegación intuitiva**: Flujo optimizado para uso empresarial
- **Offline-first**: Funciona sin conexión a internet

## 📱 Pantallas Principales

### 🏠 **Dashboard**
- Resumen de gira actual con presupuesto y gastos
- Gráficos de gastos por categoría
- Acceso rápido a funciones principales
- Indicadores de progreso de presupuesto

### 📷 **Captura de Comprobantes**
- Cámara con guías visuales para centrar documentos
- Procesamiento automático con OCR
- Línea de escaneo animada
- Opciones de captura múltiples

### ✏️ **Revisión y Edición**
- Vista previa del comprobante escaneado
- Edición de datos extraídos automáticamente
- Validación de información
- Asignación de categorías

### 📋 **Historial**
- Lista de gastos agrupados por fecha
- Filtros por categoría, monto y fecha
- Búsqueda en tiempo real
- Navegación a detalles de gastos

### ⚙️ **Configuración**
- Gestión de giras empresariales
- Configuración de perfil
- Sincronización de datos
- Cerrar sesión seguro

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- [Expo](https://expo.dev/) - Plataforma de desarrollo
- [React Native](https://reactnative.dev/) - Framework móvil
- [React Navigation](https://reactnavigation.org/) - Navegación
- [React Native Paper](https://reactnativepaper.com/) - Componentes UI
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático

### **Funcionalidades**
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/) - Captura de imágenes
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - Selección de galería
- [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) - Base de datos local
- OCR/IA - Procesamiento de comprobantes

### **Estado y Datos**
- [Zustand](https://github.com/pmndrs/zustand) - Gestión de estado global
- [React Hook Form](https://react-hook-form.com/) - Formularios
- [Zod](https://zod.dev/) - Validación de esquemas

## 📦 Instalación y Configuración

### **Prerrequisitos**
```bash
# Node.js (versión 16 o superior)
node --version

# Expo CLI
npm install -g @expo/cli

# iOS Simulator (macOS) o Android Studio
```

### **Instalación**
```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/viaticos-app.git
cd viaticos-app

# Instalar dependencias
npm install

# Instalar pods para iOS (solo macOS)
cd ios && pod install && cd ..
```

### **Configuración**
```bash
# Copiar variables de entorno
cp .env.example .env

# Configurar APIs de OCR (opcional)
# GOOGLE_VISION_API_KEY=tu_api_key
# AWS_ACCESS_KEY_ID=tu_access_key
```

## 🚀 Ejecución

```bash
# Desarrollo con Expo
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web (para pruebas)
npm run web
```

## 📁 Estructura del Proyecto

```
📁 viaticos-app/
├── 📁 src/
│   ├── 📁 components/          # Componentes reutilizables
│   │   ├── 📁 ui/              # Componentes básicos
│   │   ├── 📁 forms/           # Formularios
│   │   └── 📁 camera/          # Componentes de cámara
│   ├── 📁 screens/             # Pantallas de la aplicación
│   │   ├── 📁 auth/            # Autenticación
│   │   ├── 📁 home/            # Pantallas principales
│   │   └── 📁 config/          # Configuración
│   ├── 📁 navigation/          # Configuración de navegación
│   ├── 📁 services/            # APIs y servicios externos
│   │   ├── 📁 ocr/             # Servicio OCR
│   │   └── 📁 database/        # Base de datos local
│   ├── 📁 hooks/               # Hooks personalizados
│   ├── 📁 utils/               # Utilidades y helpers
│   ├── 📁 theme/               # Configuración de tema
│   └── 📁 types/               # Definiciones TypeScript
├── 📁 assets/                  # Recursos estáticos
├── App.js                      # Punto de entrada
├── app.json                    # Configuración Expo
└── package.json
```

## 🎯 Funcionalidades Detalladas

### **📷 Captura de Comprobantes**
1. **Captura con Cámara**: Interfaz optimizada con guías visuales
2. **Selección de Galería**: Importar imágenes existentes
3. **OCR Automático**: Extracción de datos estructurados:
   - Monto total
   - Fecha de emisión
   - RUC/NIT del establecimiento
   - Items individuales con subtotales
   - Información del comercio

### **🤖 Clasificación Inteligente**
- **Alimentación**: Restaurantes, cafeterías, supermercados
- **Transporte**: Taxis, combustible, peajes, estacionamiento
- **Alojamiento**: Hoteles, hostales, hospedajes
- **Otros**: Gastos diversos no categorizados

### **💼 Gestión de Giras**
- Creación y asignación de giras empresariales
- Presupuestos por gira con seguimiento en tiempo real
- Indicadores visuales de progreso de gasto
- Reportes automáticos por gira

### **📊 Análisis y Reportes**
- Gráficos de gastos por categoría
- Tendencias de gasto por tiempo
- Comparación de presupuesto vs. gastos reales
- Exportación de reportes (futuro)

## 🔐 Autenticación

### **Credenciales de Prueba**
```
Email: admin@viaticos.com
Contraseña: 123456
```

### **Características de Seguridad**
- Validación de formularios en tiempo real
- Manejo seguro de sesiones
- Almacenamiento local encriptado
- Confirmación para acciones críticas

## 🎨 Personalización

### **Tema Corporativo**
El tema se puede personalizar fácilmente en `src/theme/customTheme.js`:

```javascript
const BLUE_PRIMARY = '#2563EB'; // Tu color corporativo
```

### **Configuración de Colores**
- **Primario**: Azul corporativo
- **Secundario**: Grises neutros
- **Éxito**: Verde para confirmaciones
- **Error**: Rojo para validaciones
- **Advertencia**: Amarillo para alertas

## 📱 Compatibilidad

- **iOS**: 13.0+
- **Android**: API Level 21+ (Android 5.0+)
- **Expo SDK**: 49.0.0
- **React Native**: 0.72.6

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Test con coverage
npm run test:coverage

# Tests de componentes específicos
npm test -- --testPathPattern=components
```

## 🚀 Deployment

### **Build para Producción**
```bash
# Build para Android
eas build --platform android

# Build para iOS  
eas build --platform ios

# Build universal
eas build --platform all
```

### **Distribución**
- **App Store**: Configuración para iOS
- **Google Play**: Configuración para Android
- **Distribución interna**: EAS Updates

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

### **Estándares de Código**
- ESLint para JavaScript/TypeScript
- Prettier para formateo
- Conventional Commits para mensajes
- Documentación de componentes

## 🐛 Resolución de Problemas

### **Errores Comunes**

**Error de permisos de cámara**:
```bash
# iOS: Verificar Info.plist
# Android: Verificar permissions en app.json
```

**Problemas de OCR**:
```bash
# Verificar configuración de API keys
# Verificar calidad de imagen capturada
```

**Errores de navegación**:
```bash
# Verificar estructura de Stack Navigator
# Revisar configuración de rutas
```

## 📞 Soporte

- **Email**: soporte@viaticos-app.com
- **Documentación**: [Wiki del proyecto]
- **Issues**: [GitHub Issues]
- **Discord**: [Servidor de la comunidad]

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- [Expo Team](https://expo.dev/) por la plataforma de desarrollo
- [React Native Paper](https://reactnativepaper.com/) por los componentes UI
- [React Navigation](https://reactnavigation.org/) por la navegación
- Comunidad de React Native por el soporte continuo

---

