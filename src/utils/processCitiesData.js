export function processCitiesData(jsonData) {
    return jsonData.features.map(feature => ({
        HEB_NAME: feature.properties.HEB_NAME,
        ENG_NAME: feature.properties.ENG_NAME,
        ARAB_NAME: feature.properties.ARAB_NAME,
        RUS_NAME: feature.properties.RUS_NAME,
        HEB_TIME: feature.properties.HEB_TIME,
        ENG_TIME: feature.properties.ENG_TIME,
        ARAB_TIME: feature.properties.ARAB_TIME,
        RUS_TIME: feature.properties.RUS_TIME,
        MIGUN_TIME: feature.properties.MIGUN_TIME,
        NAFA_NAME: feature.properties.NAFA_NAME,
        DIST_NAME: feature.properties.DIST_NAME,
        MadaRegions: feature.properties.MadaRegions === null ? "בדיקה" : feature.properties.MadaRegions
    }));
}