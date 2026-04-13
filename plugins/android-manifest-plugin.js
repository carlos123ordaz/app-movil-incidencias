const { withAndroidManifest } = require('@expo/config-plugins');

const withCustomAndroidManifest = (config) => {
    return withAndroidManifest(config, (config) => {
        const androidManifest = config.modResults;
        const { manifest } = androidManifest;

        if (!manifest.application) {
            manifest.application = [];
        }

        const application = manifest.application[0];

        if (!application['meta-data']) {
            application['meta-data'] = [];
        }

        // Buscar si ya existe el meta-data de Firebase
        const existingMetaDataIndex = application['meta-data'].findIndex(
            (item) =>
                item.$['android:name'] ===
                'com.google.firebase.messaging.default_notification_channel_id'
        );

        // Configuración del canal
        const metaData = {
            $: {
                'android:name': 'com.google.firebase.messaging.default_notification_channel_id',
                'android:value': 'incidencias',
                'tools:replace': 'android:value' // ✅ Esto resuelve el conflicto
            }
        };

        if (existingMetaDataIndex !== -1) {
            // Reemplazar si existe
            application['meta-data'][existingMetaDataIndex] = metaData;
        } else {
            // Agregar si no existe
            application['meta-data'].push(metaData);
        }

        // Asegurar que el namespace tools esté declarado
        if (!manifest.$['xmlns:tools']) {
            manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
        }

        return config;
    });
};

module.exports = withCustomAndroidManifest;