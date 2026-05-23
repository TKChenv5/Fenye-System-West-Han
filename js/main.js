const CONFIG = {
    changan: [109.3, 35.5],
    colors: {
        '苍龙': '#00A0B0',
        '朱雀': '#E84A5F',
        '白虎': '#A1A1A1',
        '玄武': '#2A363B'
    },
    map: { 
        center: [109.3, 35.1],
        zoom: 4,
        pitch: 60,
        bearing: 0,
        maxZoom: 8,
        minZoom: 1
    },
    chapters: {
        'chapter-1': { center: [109.3, 35.1], zoom: 4, pitch: 60, bearing: 0 },
        'chapter-2': { center: [109.3, 35.1], zoom: 4, pitch: 60, bearing: 0 },
        'chapter-3': { center: [109.3, 35.1], zoom: 4, pitch: 60, bearing: 0 },
        'chapter-4': { center: [109.3, 35.1], zoom: 4, pitch: 60, bearing: 0 },
        'chapter-5': { center: [109.3, 35.1], zoom: 4, pitch: 60, bearing: 0 }
    }
};

const SKY_LABEL_ANCHORS = {
    '角宿': { ra: 201.298, dec: -11.161 },
    '亢宿': { ra: 214.004, dec: -10.774 },
    '氐宿': { ra: 222.720, dec: -16.041 },
    '房宿': { ra: 239.712, dec: -26.114 },
    '心宿': { ra: 247.352, dec: -26.432 },
    '尾宿': { ra: 263.402, dec: -37.104 },
    '箕宿': { ra: 281.414, dec: -26.991 },
    '斗宿': { ra: 283.816, dec: -26.297 },
    '牛宿': { ra: 305.253, dec: -14.781 },
    '女宿': { ra: 316.487, dec: -17.233 },
    '虚宿': { ra: 322.890, dec: -5.571 },
    '危宿': { ra: 331.446, dec: -0.319 },
    '室宿': { ra: 340.365, dec: 10.831 },
    '壁宿': { ra: 2.097, dec: 29.090 },
    '奎宿': { ra: 17.433, dec: 35.620 },
    '娄宿': { ra: 28.660, dec: 20.808 },
    '胃宿': { ra: 42.273, dec: 32.375 },
    '昴宿': { ra: 56.750, dec: 24.116 },
    '毕宿': { ra: 68.980, dec: 16.509 },
    '觜宿': { ra: 83.001, dec: -0.299 },
    '参宿': { ra: 88.793, dec: 7.407 },
    '井宿': { ra: 95.740, dec: 22.514 },
    '鬼宿': { ra: 130.821, dec: 21.468 },
    '柳宿': { ra: 138.591, dec: 2.314 },
    '星宿': { ra: 141.897, dec: -8.658 },
    '张宿': { ra: 164.944, dec: -18.299 },
    '翼宿': { ra: 188.597, dec: -23.397 },
    '轸宿': { ra: 183.952, dec: -17.541 }
};

let map = null;
let currentHighlight = null;
let currentFilter = 'all';
let dataLoaded = false;
let virtualsky = null;
let skyPanelCollapsed = false;
let starsGeoJson = null;
let statesGeoJson = null;
let linesGeoJson = null;
let analysisSectorGeoJson = null;
let comparisonLinesGeoJson = null;
let skyOverlayAnimationFrame = null;
let skyRenderPending = false;
let skyResizeTimer = null;
let skyTrackLastTime = 0;
let skyFusionMode = true;
let skyObserverLayoutPending = false;
let skyLastPanelSize = { width: 0, height: 0 };
let skyUserPanelSize = null;
let skyResizeDragState = null;
let observerHeadingBaseline = null;
let observerHeadingLastSkyAz = null;
let suppressMapHeadingSync = false;
let suppressSkyHeadingSync = false;
let currentLanguage = 'zh';
let chapterHtmlCache = {};

const I18N = window.HAN_FENYE_I18N || {
    storageKey: 'han-fenye-language',
    ui: { zh: {}, en: {} },
    symbols: {},
    states: {},
    stars: {},
    nav: { zh: {}, en: {} },
    chapters: { en: {} }
};

const SKY_TRACKING_FPS = 24;
const SKY_TRACKING_FRAME_MS = 1000 / SKY_TRACKING_FPS;
const ANALYSIS_ALIGNMENT_THRESHOLDS = {
    aligned: 22,
    slight: 55
};
const ANALYSIS_SOURCE_NOTE = '依据《史记·天官书》整理，并以长安为中心进行方向比较。';
const ANALYSIS_COMPARE_NOTE = '依据《汉书·天文志》整理，用于与《史记·天官书》进行分野差异比较。';
const HANSHU_SAMPLE_ASSIGNMENTS = {
    '角宿': '兖州',
    '亢宿': '兖州',
    '氐宿': '兖州',
    '房宿': '豫州',
    '心宿': '豫州',
    '尾宿': '幽州',
    '箕宿': '幽州',
    '斗宿': '江/湖',
    '牛宿': '扬州',
    '女宿': '扬州',
    '虚宿': '青州',
    '危宿': '青州',
    '室宿': '并州',
    '壁宿': '并州',
    '奎宿': '徐州',
    '娄宿': '徐州',
    '胃宿': '徐州',
    '昴宿': '冀州',
    '毕宿': '冀州',
    '觜宿': '益州',
    '参宿': '益州',
    '井宿': '雍州',
    '鬼宿': '雍州',
    '柳宿': '三河',
    '星宿': '三河',
    '张宿': '三河',
    '翼宿': '荆州',
    '轸宿': '荆州'
};
const STAR_NAME_ALIASES = {
    '昂宿': '昴宿'
};
const SKY_PANEL_DEFAULT_SCALE = 80;
const SKY_PANEL_SCALE_DEFAULT = 100;
const SKY_PANEL_SCALE_MIN = 80;
const SKY_PANEL_SCALE_MAX = 140;

const skyState = {
    hoveredStar: null,
    lockedStar: null,
    approxCount: 0
};

const analysisState = {
    symbol: 'all',
    alignment: 'all',
    relation: 'all',
    compare: 'shiji'
};

function t(key, vars = {}) {
    const template = I18N.ui[currentLanguage]?.[key] ?? I18N.ui.zh?.[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}

function getDisplaySymbolLabel(symbol) {
    if (currentLanguage === 'en') return I18N.symbols[symbol] || symbol;
    return symbol;
}

function getDisplayStateLabel(stateName) {
    if (currentLanguage === 'en') return I18N.states[stateName] || stateName;
    return stateName;
}

function getDisplayStarLabel(starName) {
    const normalizedName = normalizeStarName(starName);
    if (currentLanguage === 'en') return I18N.stars[normalizedName] || normalizedName;
    return normalizedName;
}

function getDisplayRelationType(relationType) {
    if (currentLanguage !== 'en') return relationType;
    if (relationType === '多宿共州') return t('relationMultiState');
    if (relationType === '跨向对应') return t('relationCross');
    if (relationType === '同向对应') return t('relationSameDirection');
    if (relationType === '一宿多地') return t('relationOneStarManyStates');
    return relationType;
}

function getDisplaySourceVersion(sourceLabel) {
    if (currentLanguage !== 'en') return sourceLabel;
    if (sourceLabel === '《史记·天官书》') return t('sourceLabelShiji');
    if (sourceLabel === '《汉书·天文志》') return t('sourceLabelHanshu');
    return sourceLabel;
}

function translateListItems(items, translator) {
    if (!items) return '';
    return String(items)
        .split('、')
        .map((item) => translator(item))
        .join(currentLanguage === 'en' ? ', ' : '、');
}

function initializeChapterHtmlCache() {
    if (Object.keys(chapterHtmlCache).length > 0) return;
    document.querySelectorAll('.chapter').forEach((chapter) => {
        chapterHtmlCache[chapter.id] = chapter.innerHTML;
    });
}

function updateLanguageToggleButton() {
    const button = document.getElementById('language-toggle');
    if (!button) return;

    const switchingToEnglish = currentLanguage === 'zh';
    button.textContent = switchingToEnglish ? 'EN' : '中文';
    button.setAttribute('aria-label', switchingToEnglish ? t('switchToEnglish') : t('switchToChinese'));
    button.title = button.getAttribute('aria-label');
}

function setInfoPanelPlaceholder() {
    const title = document.getElementById('panel-title');
    const content = document.getElementById('panel-content');
    if (title && !currentHighlight) title.textContent = t('infoTitleDefault');
    if (content && !currentHighlight) {
        content.innerHTML = `<p class="placeholder">${t('infoPlaceholder')}</p>`;
    }
}

function setDetailFocusMode(active) {
    document.body.classList.toggle('is-detail-focus', !!active);
}

function hideInfoPanel() {
    const panel = document.querySelector('.info-panel');
    if (panel) {
        panel.classList.remove('active');
    }
    setDetailFocusMode(false);
    setInfoPanelPlaceholder();
}

function applyStaticTranslations() {
    document.documentElement.lang = currentLanguage === 'en' ? 'en' : 'zh-CN';
    document.title = t('documentTitle');

    const title = document.querySelector('.title');
    if (title) title.textContent = t('pageTitle');

    const observerLabel = document.querySelector('.observer-label');
    if (observerLabel) observerLabel.textContent = t('observerLabel');

    const skyTitle = document.querySelector('.sky-panel-header h3');
    if (skyTitle) skyTitle.textContent = t('skyTitle');

    const sizeLabel = document.querySelector('.sky-panel-size-control span');
    if (sizeLabel) sizeLabel.textContent = t('sizeLabel');

    const resetButton = document.getElementById('sky-panel-reset');
    if (resetButton) resetButton.textContent = t('resetSize');

    const skyToggle = document.getElementById('sky-panel-toggle');
    if (skyToggle) skyToggle.textContent = skyPanelCollapsed ? t('skyExpand') : t('skyCollapse');

    const skyFab = document.getElementById('sky-panel-fab');
    if (skyFab) skyFab.textContent = skyPanelCollapsed ? t('skyFabOpen') : t('skyFabCollapse');

    const coordText = document.getElementById('coord-text');
    if (coordText && (!map || coordText.textContent.includes('长安') || coordText.textContent.includes("Chang'an") || coordText.textContent.includes('坐标') || coordText.textContent.includes('Coords'))) {
        coordText.textContent = t('coordInitial');
    }

    const coordLabel = document.querySelector('.coord-label');
    if (coordLabel) coordLabel.textContent = t('coordMouse');

    const legendTitle = document.querySelector('.analysis-legend-title');
    if (legendTitle) legendTitle.textContent = t('legendTitle');
    const legendItems = document.querySelectorAll('.analysis-legend-item span:last-child');
    if (legendItems[0]) legendItems[0].textContent = t('legendAligned');
    if (legendItems[1]) legendItems[1].textContent = t('legendSlight');
    if (legendItems[2]) legendItems[2].textContent = t('legendSignificant');
    const legendNote = document.querySelector('.analysis-legend-note');
    if (legendNote) legendNote.textContent = t('legendNote');

    const toolbarLabels = document.querySelectorAll('.analysis-toolbar-label');
    if (toolbarLabels[0]) toolbarLabels[0].textContent = t('toolbarAlignment');
    if (toolbarLabels[1]) toolbarLabels[1].textContent = t('toolbarRelation');
    if (toolbarLabels[2]) toolbarLabels[2].textContent = t('toolbarSource');

    const alignmentButtons = document.querySelectorAll('.analysis-filter-btn[data-group="alignment"]');
    if (alignmentButtons[0]) alignmentButtons[0].textContent = t('alignmentAll');
    if (alignmentButtons[1]) alignmentButtons[1].textContent = t('alignmentDeviation');
    if (alignmentButtons[2]) alignmentButtons[2].textContent = t('alignmentSignificant');

    const relationButtons = document.querySelectorAll('.analysis-filter-btn[data-group="relation"]');
    if (relationButtons[0]) relationButtons[0].textContent = t('relationAll');
    if (relationButtons[1]) relationButtons[1].textContent = t('relationMultiState');
    if (relationButtons[2]) relationButtons[2].textContent = t('relationCross');

    const compareButtons = document.querySelectorAll('.analysis-filter-btn[data-group="compare"]');
    if (compareButtons[0]) compareButtons[0].textContent = t('sourceShiji');
    if (compareButtons[1]) compareButtons[1].textContent = t('sourceHanshu');
    if (compareButtons[2]) compareButtons[2].textContent = t('sourceCompare');

    const methodToggle = document.getElementById('analysis-method-toggle');
    if (methodToggle) methodToggle.textContent = t('methodToggle');

    const statsTitle = document.querySelector('.analysis-stats-title');
    if (statsTitle) statsTitle.textContent = t('statsTitle');

    const statsBody = document.querySelector('.analysis-stats-body');
    if (statsBody && !dataLoaded) statsBody.textContent = t('statsPreparing');

    const methodHeader = document.querySelector('.analysis-method-header span');
    if (methodHeader) methodHeader.textContent = t('methodTitle');

    const methodSections = document.querySelectorAll('.analysis-method-section');
    const sectionKeys = [
        ['methodSection1Title', 'methodSection1Body'],
        ['methodSection2Title', 'methodSection2Body']
    ];
    methodSections.forEach((section, index) => {
        const strong = section.querySelector('strong');
        const p = section.querySelector('p');
        if (strong) strong.textContent = t(sectionKeys[index][0]);
        if (p) p.textContent = t(sectionKeys[index][1]);
    });

    document.querySelectorAll('.filter-btn').forEach((button) => {
        const value = button.dataset.filter;
        button.textContent = value === 'all' ? t('filterAll') : getDisplaySymbolLabel(value);
    });

    document.querySelectorAll('.nav-btn').forEach((button) => {
        const navText = button.querySelector('.nav-text');
        if (navText) navText.textContent = I18N.nav[currentLanguage]?.[button.dataset.chapter] || navText.textContent;
    });

    document.querySelectorAll('.chapter').forEach((chapter) => {
        chapter.innerHTML = currentLanguage === 'en'
            ? (I18N.chapters.en?.[chapter.id] || chapterHtmlCache[chapter.id])
            : chapterHtmlCache[chapter.id];
    });

    updateLanguageToggleButton();
    setInfoPanelPlaceholder();
}

function localizeMapDataLabels() {
    if (!starsGeoJson || !statesGeoJson) return;

    starsGeoJson.features.forEach((feature) => {
        feature.properties.displayLabel = getDisplayStarLabel(feature.properties['星宿名']);
    });

    statesGeoJson.features.forEach((feature) => {
        feature.properties.displayLabel = getDisplayStateLabel(feature.properties['州郡名']);
    });
}

function getInitialLanguage() {
    try {
        const saved = localStorage.getItem(I18N.storageKey);
        if (saved === 'en' || saved === 'zh') return saved;
    } catch (error) {
        console.warn('读取语言设置失败:', error);
    }
    return 'zh';
}

function getActiveSkyStarName() {
    if (skyState.lockedStar) return skyState.lockedStar;
    if (skyState.hoveredStar) return skyState.hoveredStar;
    return currentHighlight?.starName || currentHighlight?.star || null;
}

function getStarFeatureByName(starName) {
    if (!starName) return null;
    return getSourceFeatures('stars').find((feature) => feature.properties['星宿名'] === starName) || null;
}

function normalizeDegrees(value) {
    const degrees = Number(value) || 0;
    return ((degrees % 360) + 360) % 360;
}

function getSignedAngleDelta(from, to) {
    let delta = normalizeDegrees(to) - normalizeDegrees(from);

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    return delta;
}

function getAbsoluteAngleDelta(from, to) {
    return Math.abs(getSignedAngleDelta(from, to));
}

function normalizeStarName(name) {
    return STAR_NAME_ALIASES[name] || name || '';
}

function normalizeStateName(name) {
    return String(name || '').replace(/\s+/g, '').trim();
}

function getFirstStarName(value) {
    return String(value || '').split('、').map((item) => item.trim()).filter(Boolean)[0] || '';
}

function getFeatureCoordinates(feature) {
    if (!feature?.geometry) return null;

    if (feature.geometry.type === 'Point') {
        return feature.geometry.coordinates;
    }

    if (feature.geometry.type === 'LineString') {
        return feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length / 2)] || null;
    }

    if (feature.geometry.type === 'MultiLineString') {
        const line = feature.geometry.coordinates[0] || [];
        return line[Math.floor(line.length / 2)] || null;
    }

    return null;
}

function getCompassAzimuthFromCoordinates(coordinates) {
    if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

    const dx = Number(coordinates[0]) - CONFIG.changan[0];
    const dy = Number(coordinates[1]) - CONFIG.changan[1];

    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
    if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return 0;

    const mathDegrees = Math.atan2(dy, dx) * 180 / Math.PI;
    return normalizeDegrees(90 - mathDegrees);
}

function classifyAlignment(angleDelta) {
    if (!Number.isFinite(angleDelta)) return 'significant';
    if (angleDelta <= ANALYSIS_ALIGNMENT_THRESHOLDS.aligned) return 'aligned';
    if (angleDelta <= ANALYSIS_ALIGNMENT_THRESHOLDS.slight) return 'slight';
    return 'significant';
}

function getAlignmentMeta(alignmentClass) {
    if (alignmentClass === 'aligned') {
        return {
            label: currentLanguage === 'en' ? 'Aligned' : '一致',
            description: currentLanguage === 'en'
                ? 'The regional azimuth broadly agrees with the stellar azimuth.'
                : '州郡方位与星宿方位整体接近。'
        };
    }

    if (alignmentClass === 'slight') {
        return {
            label: currentLanguage === 'en' ? 'Slight deviation' : '轻微偏离',
            description: currentLanguage === 'en'
                ? 'There is a noticeable angular difference, but the directional association still remains.'
                : '存在一定角度差，但总体仍保留方向关联。'
        };
    }

    return {
        label: currentLanguage === 'en' ? 'Significant deviation' : '显著偏离',
        description: currentLanguage === 'en'
            ? 'The angular gap is large enough to require historical or textual explanation.'
            : '角度差较大，需要结合政治或文本背景解释。'
    };
}

function getRelationType(angleDelta, relatedStarCount, relatedStateCount = 1) {
    if (relatedStarCount > 1) return '多宿共州';
    if (relatedStateCount > 1) return '一宿多地';
    if (angleDelta > 45) return '跨向对应';
    return '同向对应';
}

function createLookupMap(features, propertyName, normalizer) {
    return new Map(features.map((feature) => [normalizer(feature.properties[propertyName]), feature]));
}

function createSectorPolygon(startAzimuth, endAzimuth, radius = 18, steps = 32) {
    const start = normalizeDegrees(startAzimuth);
    let end = normalizeDegrees(endAzimuth);

    if (end <= start) {
        end += 360;
    }

    const ring = [[CONFIG.changan[0], CONFIG.changan[1]]];
    const step = Math.max(2, (end - start) / steps);

    for (let angle = start; angle <= end; angle += step) {
        const radians = (90 - angle) * Math.PI / 180;
        ring.push([
            CONFIG.changan[0] + Math.cos(radians) * radius,
            CONFIG.changan[1] + Math.sin(radians) * radius
        ]);
    }

    const endRadians = (90 - end) * Math.PI / 180;
    ring.push([
        CONFIG.changan[0] + Math.cos(endRadians) * radius,
        CONFIG.changan[1] + Math.sin(endRadians) * radius
    ]);
    ring.push([CONFIG.changan[0], CONFIG.changan[1]]);

    return ring;
}

function buildAnalysisSectors(starsData) {
    const groups = new Map();

    starsData.features.forEach((feature) => {
        const symbol = feature.properties['四象'];
        const azimuth = Number(feature.properties['方位角']);

        if (!groups.has(symbol)) {
            groups.set(symbol, []);
        }

        if (Number.isFinite(azimuth)) {
            groups.get(symbol).push(azimuth);
        }
    });

    const features = Array.from(groups.entries()).map(([symbol, angles], index) => {
        const minAngle = Math.min(...angles);
        const maxAngle = Math.max(...angles);
        const padding = 7;
        const startAngle = minAngle - padding;
        const endAngle = maxAngle + padding;

        return {
            type: 'Feature',
            properties: {
                id: index + 1,
                四象: symbol,
                起始角: normalizeDegrees(startAngle),
                结束角: normalizeDegrees(endAngle)
            },
            geometry: {
                type: 'Polygon',
                coordinates: [createSectorPolygon(startAngle, endAngle)]
            }
        };
    });

    return {
        type: 'FeatureCollection',
        features
    };
}

function buildAnalysisLines(starsData, statesData) {
    const stateMap = createLookupMap(statesData.features, '州郡名', normalizeStateName);
    const starCountsByState = new Map();

    starsData.features.forEach((feature) => {
        const stateName = normalizeStateName(feature.properties['分野州郡']);
        starCountsByState.set(stateName, (starCountsByState.get(stateName) || 0) + 1);
    });

    const features = starsData.features.map((feature, index) => {
        const starName = normalizeStarName(feature.properties['星宿名']);
        const stateName = normalizeStateName(feature.properties['分野州郡']);
        const stateFeature = stateMap.get(stateName);
        const starCoordinates = getFeatureCoordinates(feature);
        const stateCoordinates = getFeatureCoordinates(stateFeature);
        const starAzimuth = Number(feature.properties['方位角']);
        const stateAzimuth = getCompassAzimuthFromCoordinates(stateCoordinates);
        const angleDelta = getAbsoluteAngleDelta(starAzimuth, stateAzimuth);
        const alignmentClass = classifyAlignment(angleDelta);
        const alignmentMeta = getAlignmentMeta(alignmentClass);
        const relatedStarCount = starCountsByState.get(stateName) || 1;

        return {
            type: 'Feature',
            properties: {
                id: index + 1,
                州郡: stateFeature?.properties['州郡名'] || feature.properties['分野州郡'],
                星宿: feature.properties['星宿名'],
                规范星宿: starName,
                四象: feature.properties['四象'],
                星宿方位: Number.isFinite(starAzimuth) ? Number(starAzimuth.toFixed(2)) : null,
                州郡方位: Number.isFinite(stateAzimuth) ? Number(stateAzimuth.toFixed(2)) : null,
                角度差: Number.isFinite(angleDelta) ? Number(angleDelta.toFixed(2)) : null,
                对应分级: alignmentClass,
                对应评级: alignmentMeta.label,
                关系类型: getRelationType(angleDelta, relatedStarCount),
                同州宿数: relatedStarCount,
                关联星宿: starsData.features
                    .filter((starFeature) => normalizeStateName(starFeature.properties['分野州郡']) === stateName)
                    .map((starFeature) => starFeature.properties['星宿名'])
                    .join('、'),
                文本依据: ANALYSIS_SOURCE_NOTE,
                文献版本: '《史记·天官书》',
                比较状态: 'base'
            },
            geometry: {
                type: 'LineString',
                coordinates: [starCoordinates, stateCoordinates].filter(Boolean)
            }
        };
    }).filter((feature) => feature.geometry.coordinates.length === 2);

    return {
        type: 'FeatureCollection',
        features
    };
}

function buildComparisonLines(starsData, statesData) {
    const stateMap = createLookupMap(statesData.features, '州郡名', normalizeStateName);
    const compareAssignments = new Map();

    starsData.features.forEach((feature) => {
        const starName = normalizeStarName(feature.properties['星宿名']);
        const targetState = HANSHU_SAMPLE_ASSIGNMENTS[starName] || feature.properties['分野州郡'];
        compareAssignments.set(starName, targetState);
    });

    const starCountsByState = new Map();
    compareAssignments.forEach((stateName) => {
        const normalizedStateName = normalizeStateName(stateName);
        starCountsByState.set(normalizedStateName, (starCountsByState.get(normalizedStateName) || 0) + 1);
    });

    const features = starsData.features.map((feature, index) => {
        const starName = normalizeStarName(feature.properties['星宿名']);
        const baseStateName = feature.properties['分野州郡'];
        const compareStateName = compareAssignments.get(starName) || baseStateName;
        const stateFeature = stateMap.get(normalizeStateName(compareStateName));
        const starCoordinates = getFeatureCoordinates(feature);
        const stateCoordinates = getFeatureCoordinates(stateFeature);
        const starAzimuth = Number(feature.properties['方位角']);
        const stateAzimuth = getCompassAzimuthFromCoordinates(stateCoordinates);
        const angleDelta = getAbsoluteAngleDelta(starAzimuth, stateAzimuth);
        const alignmentClass = classifyAlignment(angleDelta);
        const alignmentMeta = getAlignmentMeta(alignmentClass);
        const relatedStarCount = starCountsByState.get(normalizeStateName(compareStateName)) || 1;
        const changed = normalizeStateName(compareStateName) !== normalizeStateName(baseStateName);

        return {
            type: 'Feature',
            properties: {
                id: index + 1,
                州郡: compareStateName,
                星宿: feature.properties['星宿名'],
                四象: feature.properties['四象'],
                星宿方位: Number.isFinite(starAzimuth) ? Number(starAzimuth.toFixed(2)) : null,
                州郡方位: Number.isFinite(stateAzimuth) ? Number(stateAzimuth.toFixed(2)) : null,
                角度差: Number.isFinite(angleDelta) ? Number(angleDelta.toFixed(2)) : null,
                对应分级: alignmentClass,
                对应评级: alignmentMeta.label,
                关系类型: getRelationType(angleDelta, relatedStarCount),
                同州宿数: relatedStarCount,
                关联星宿: starsData.features
                    .filter((starFeature) => normalizeStateName(compareAssignments.get(normalizeStarName(starFeature.properties['星宿名'])) || starFeature.properties['分野州郡']) === normalizeStateName(compareStateName))
                    .map((starFeature) => starFeature.properties['星宿名'])
                    .join('、'),
                文本依据: ANALYSIS_COMPARE_NOTE,
                文献版本: '《汉书·天文志》',
                比较状态: changed ? 'changed' : 'same',
                原始州郡: baseStateName,
                差异说明: changed ? `当前示意将 ${feature.properties['星宿名']} 由 ${baseStateName} 调整为 ${compareStateName}，用于展示文献差异高亮。` : '该样本在比较层中暂未显示明显差异。'
            },
            geometry: {
                type: 'LineString',
                coordinates: [starCoordinates, stateCoordinates].filter(Boolean)
            }
        };
    }).filter((feature) => feature.geometry.coordinates.length === 2);

    return {
        type: 'FeatureCollection',
        features
    };
}

function enrichAnalysisData() {
    const stateMap = createLookupMap(statesGeoJson.features, '州郡名', normalizeStateName);
    const starCountsByState = new Map();

    starsGeoJson.features.forEach((feature) => {
        const stateName = normalizeStateName(feature.properties['分野州郡']);
        starCountsByState.set(stateName, (starCountsByState.get(stateName) || 0) + 1);
    });

    statesGeoJson.features.forEach((feature) => {
        const normalizedStateName = normalizeStateName(feature.properties['州郡名']);
        const relatedStars = starsGeoJson.features.filter((starFeature) => normalizeStateName(starFeature.properties['分野州郡']) === normalizedStateName);
        const stateAzimuth = getCompassAzimuthFromCoordinates(getFeatureCoordinates(feature));
        const deltas = relatedStars
            .map((starFeature) => getAbsoluteAngleDelta(Number(starFeature.properties['方位角']), stateAzimuth))
            .filter((delta) => Number.isFinite(delta));
        const averageDelta = deltas.length ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length : null;
        const maxDelta = deltas.length ? Math.max(...deltas) : null;
        const alignmentClass = classifyAlignment(averageDelta);
        const alignmentMeta = getAlignmentMeta(alignmentClass);

        feature.properties['州郡方位'] = Number.isFinite(stateAzimuth) ? Number(stateAzimuth.toFixed(2)) : null;
        feature.properties['对应宿数'] = relatedStars.length;
        feature.properties['分野星宿'] = relatedStars.map((starFeature) => starFeature.properties['星宿名']).join('、');
        feature.properties['关联星宿列表'] = relatedStars.map((starFeature) => starFeature.properties['星宿名']).join('、');
        feature.properties['平均角度差'] = Number.isFinite(averageDelta) ? Number(averageDelta.toFixed(2)) : null;
        feature.properties['最大角度差'] = Number.isFinite(maxDelta) ? Number(maxDelta.toFixed(2)) : null;
        feature.properties['对应分级'] = alignmentClass;
        feature.properties['对应评级'] = alignmentMeta.label;
        feature.properties['关系类型'] = getRelationType(maxDelta, relatedStars.length);
        feature.properties['文本依据'] = ANALYSIS_SOURCE_NOTE;
    });

    starsGeoJson.features.forEach((feature) => {
        const normalizedStateName = normalizeStateName(feature.properties['分野州郡']);
        const stateFeature = stateMap.get(normalizedStateName);
        const stateAzimuth = getCompassAzimuthFromCoordinates(getFeatureCoordinates(stateFeature));
        const starAzimuth = Number(feature.properties['方位角']);
        const angleDelta = getAbsoluteAngleDelta(starAzimuth, stateAzimuth);
        const alignmentClass = classifyAlignment(angleDelta);
        const alignmentMeta = getAlignmentMeta(alignmentClass);
        const relatedStarCount = starCountsByState.get(normalizedStateName) || 1;

        feature.properties['州郡方位'] = Number.isFinite(stateAzimuth) ? Number(stateAzimuth.toFixed(2)) : null;
        feature.properties['角度差'] = Number.isFinite(angleDelta) ? Number(angleDelta.toFixed(2)) : null;
        feature.properties['对应分级'] = alignmentClass;
        feature.properties['对应评级'] = alignmentMeta.label;
        feature.properties['同州宿数'] = relatedStarCount;
        feature.properties['关系类型'] = getRelationType(angleDelta, relatedStarCount);
        feature.properties['关联星宿'] = starsGeoJson.features
            .filter((starFeature) => normalizeStateName(starFeature.properties['分野州郡']) === normalizedStateName)
            .map((starFeature) => starFeature.properties['星宿名'])
            .join('、');
        feature.properties['文本依据'] = ANALYSIS_SOURCE_NOTE;
    });

    linesGeoJson = buildAnalysisLines(starsGeoJson, statesGeoJson);
    comparisonLinesGeoJson = buildComparisonLines(starsGeoJson, statesGeoJson);
    analysisSectorGeoJson = buildAnalysisSectors(starsGeoJson);
}

function getFeatureIndex(features, predicate) {
    return features.findIndex(predicate);
}

function getLineMidpoint(feature) {
    const coordinates = feature?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length === 0) return CONFIG.changan;
    return coordinates[Math.floor(coordinates.length / 2)] || CONFIG.changan;
}

function renderAnalysisBadge(alignmentClass, label) {
    return `<span class="analysis-badge is-${alignmentClass}">${label}</span>`;
}

function renderAnalysisMetrics(metrics) {
    return `
        <div class="analysis-inline-grid">
            ${metrics.map((metric) => `
                <div class="analysis-metric">
                    <div class="analysis-metric-label">${metric.label}</div>
                    <div class="analysis-metric-value">${metric.value}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderEvidenceBlock(properties, note) {
    const alignmentMeta = getAlignmentMeta(properties['对应分级']);
    return `
        ${renderAnalysisBadge(properties['对应分级'], alignmentMeta.label)}
        ${renderAnalysisMetrics([
            { label: t('metricStarAzimuth'), value: `${Number(properties['星宿方位']).toFixed(2)}°` },
            { label: t('metricStateAzimuth'), value: `${Number(properties['州郡方位']).toFixed(2)}°` },
            { label: t('metricAngleDelta'), value: `${Number(properties['角度差']).toFixed(2)}°` },
            { label: t('metricRelationType'), value: getDisplayRelationType(properties['关系类型']) }
        ])}
        <div class="analysis-note">${note}</div>
    `;
}

function matchesAlignmentFilter(properties) {
    if (analysisState.alignment === 'all') return true;
    if (analysisState.alignment === 'deviation') {
        return properties['对应分级'] === 'slight' || properties['对应分级'] === 'significant';
    }
    return properties['对应分级'] === analysisState.alignment;
}

function matchesRelationFilter(properties) {
    if (analysisState.relation === 'all') return true;
    return properties['关系类型'] === analysisState.relation;
}

function matchesSymbolFilter(properties) {
    if (analysisState.symbol === 'all') return true;
    return properties['四象'] === analysisState.symbol;
}

function getFilterExpressionForGroup(group, value) {
    if (group === 'symbol' && value !== 'all') {
        return ['==', ['get', '四象'], value];
    }

    if (group === 'alignment') {
        if (value === 'deviation') {
            return ['any', ['==', ['get', '对应分级'], 'slight'], ['==', ['get', '对应分级'], 'significant']];
        }
        if (value !== 'all') {
            return ['==', ['get', '对应分级'], value];
        }
    }

    if (group === 'relation' && value !== 'all') {
        return ['==', ['get', '关系类型'], value];
    }

    if (group === 'comparison-state' && value !== 'all') {
        return ['==', ['get', '比较状态'], value];
    }

    return null;
}

function buildLayerFilter(groups) {
    const expressions = groups
        .map(({ group, value }) => getFilterExpressionForGroup(group, value))
        .filter(Boolean);

    if (expressions.length === 0) return null;
    if (expressions.length === 1) return expressions[0];
    return ['all', ...expressions];
}

function getActiveLineFeatures() {
    let features = [];

    if (analysisState.compare === 'hanshu') {
        features = comparisonLinesGeoJson?.features || [];
    } else if (analysisState.compare === 'compare') {
        features = (comparisonLinesGeoJson?.features || []).filter((feature) => feature.properties['比较状态'] === 'changed');
    } else {
        features = linesGeoJson?.features || [];
    }

    return features.filter((feature) => matchesSymbolFilter(feature.properties) && matchesAlignmentFilter(feature.properties) && matchesRelationFilter(feature.properties));
}

function getCompareModeLabel() {
    if (analysisState.compare === 'hanshu') return t('modeHanshu');
    if (analysisState.compare === 'compare') return t('modeCompare');
    return t('modeShiji');
}

function updateAnalysisStats() {
    const statsBody = document.querySelector('.analysis-stats-body');
    if (!statsBody) return;

    const activeFeatures = getActiveLineFeatures();
    const alignedCount = activeFeatures.filter((feature) => feature.properties['对应分级'] === 'aligned').length;
    const slightCount = activeFeatures.filter((feature) => feature.properties['对应分级'] === 'slight').length;
    const significantCount = activeFeatures.filter((feature) => feature.properties['对应分级'] === 'significant').length;
    const multiStateCount = activeFeatures.filter((feature) => feature.properties['关系类型'] === '多宿共州').length;
    const crossCount = activeFeatures.filter((feature) => feature.properties['关系类型'] === '跨向对应').length;
    const changedCount = (comparisonLinesGeoJson?.features || []).filter((feature) => matchesSymbolFilter(feature.properties) && feature.properties['比较状态'] === 'changed').length;
    const extra = analysisState.compare !== 'shiji' ? t('statsDiffExtra', { count: changedCount }) : '';

    statsBody.innerHTML = `
        <div class="analysis-stats-mode">
            ${t('statsCurrentMode', { mode: getCompareModeLabel(), count: activeFeatures.length, extra })}
        </div>
        <div class="analysis-stats-grid">
            <div class="analysis-stats-card"><strong>${alignedCount}</strong><span>${t('statsAligned')}</span></div>
            <div class="analysis-stats-card"><strong>${slightCount + significantCount}</strong><span>${t('statsDeviation')}</span></div>
            <div class="analysis-stats-card"><strong>${multiStateCount}</strong><span>${t('statsMultiState')}</span></div>
            <div class="analysis-stats-card"><strong>${crossCount}</strong><span>${t('statsCross')}</span></div>
        </div>
    `;
}

function updateAnalysisFilterButtons() {
    document.querySelectorAll('.analysis-filter-btn').forEach((button) => {
        const group = button.dataset.group;
        const value = button.dataset.value;
        button.classList.toggle('is-active', analysisState[group] === value);
    });
}

function syncAnalysisFilters() {
    updateAnalysisFilterButtons();
    updateAnalysisStats();

    if (!map || !dataLoaded) return;

    const symbolFilter = buildLayerFilter([{ group: 'symbol', value: analysisState.symbol }]);
    const lineFilter = buildLayerFilter([
        { group: 'symbol', value: analysisState.symbol },
        { group: 'alignment', value: analysisState.alignment },
        { group: 'relation', value: analysisState.relation }
    ]);
    const comparisonFilter = buildLayerFilter([
        { group: 'symbol', value: analysisState.symbol },
        { group: 'alignment', value: analysisState.alignment },
        { group: 'relation', value: analysisState.relation },
        { group: 'comparison-state', value: analysisState.compare === 'compare' ? 'changed' : 'all' }
    ]);

    map.setFilter('stars-layer', symbolFilter);
    map.setFilter('stars-label', symbolFilter);
    map.setFilter('fenye-lines', lineFilter);
    map.setFilter('analysis-sectors-fill', symbolFilter);
    map.setFilter('analysis-sectors-outline', symbolFilter);
    map.setFilter('comparison-lines', comparisonFilter);

    map.setLayoutProperty('fenye-lines', 'visibility', analysisState.compare === 'hanshu' ? 'none' : 'visible');
    map.setLayoutProperty('comparison-lines', 'visibility', analysisState.compare === 'shiji' ? 'none' : 'visible');
}

function toggleMethodPanel(forceOpen) {
    const panel = document.getElementById('analysis-method-panel');
    const toggleButton = document.getElementById('analysis-method-toggle');
    if (!panel || !toggleButton) return;

    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.hasAttribute('hidden');
    panel.toggleAttribute('hidden', !shouldOpen);
    toggleButton.classList.toggle('is-active', shouldOpen);
    toggleButton.setAttribute('aria-expanded', String(shouldOpen));
}

function getFacingLabel(degrees) {
    const labels = currentLanguage === 'en'
        ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
        : ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const normalized = normalizeDegrees(degrees);
    const index = Math.round(normalized / 45) % labels.length;
    return `${labels[index]} · ${normalized.toFixed(0)}°`;
}

function ensureObserverHeadingBaseline() {
    if (observerHeadingBaseline || !map || !virtualsky) return;

    observerHeadingBaseline = {
        mapBearing: normalizeDegrees(map.getBearing()),
        skyAzOff: normalizeDegrees(virtualsky.az_off)
    };
    observerHeadingLastSkyAz = observerHeadingBaseline.skyAzOff;
}

function syncMapHeadingToSky(force = false) {
    if (!map || !virtualsky || suppressSkyHeadingSync) return;

    ensureObserverHeadingBaseline();
    if (!observerHeadingBaseline) return;

    const currentSkyAz = normalizeDegrees(virtualsky.az_off);
    const currentMapBearing = normalizeDegrees(map.getBearing());
    const skyDelta = getSignedAngleDelta(observerHeadingBaseline.skyAzOff, currentSkyAz);
    const targetBearing = normalizeDegrees(observerHeadingBaseline.mapBearing + skyDelta);
    const bearingDelta = Math.abs(getSignedAngleDelta(currentMapBearing, targetBearing));
    const skyChange = observerHeadingLastSkyAz === null ? 999 : Math.abs(getSignedAngleDelta(observerHeadingLastSkyAz, currentSkyAz));

    if (!force && bearingDelta < 0.35 && skyChange < 0.35) {
        return;
    }

    observerHeadingLastSkyAz = currentSkyAz;
    suppressMapHeadingSync = true;
    map.rotateTo(targetBearing, { duration: 0 });
    suppressMapHeadingSync = false;
}

function syncSkyHeadingToMap() {
    if (!map || !virtualsky || suppressMapHeadingSync) return;

    ensureObserverHeadingBaseline();
    if (!observerHeadingBaseline) return;

    const currentMapBearing = normalizeDegrees(map.getBearing());
    const currentSkyAz = normalizeDegrees(virtualsky.az_off);
    const mapDelta = getSignedAngleDelta(observerHeadingBaseline.mapBearing, currentMapBearing);
    const targetSkyAz = normalizeDegrees(observerHeadingBaseline.skyAzOff + mapDelta);

    if (Math.abs(getSignedAngleDelta(currentSkyAz, targetSkyAz)) < 0.35) {
        return;
    }

    suppressSkyHeadingSync = true;
    virtualsky.az_off = targetSkyAz;
    observerHeadingLastSkyAz = targetSkyAz;
    if (typeof virtualsky.draw === 'function') {
        virtualsky.draw();
    }
    suppressSkyHeadingSync = false;
    scheduleSkyOverlayRender();
}

function scheduleSkyOverlayRender() {
    if (skyPanelCollapsed || skyRenderPending) return;

    skyRenderPending = true;
    requestAnimationFrame(() => {
        skyRenderPending = false;
        renderSkyStarOverlay();
    });
}

function scheduleSkyObserverLayout() {
    if (skyPanelCollapsed || skyObserverLayoutPending) return;

    skyObserverLayoutPending = true;
    requestAnimationFrame(() => {
        skyObserverLayoutPending = false;
        updateSkyObserverLayout();
    });
}

function updateSkyPanelStatus(mainText, metaText, tone = 'normal') {
    const mainEl = document.getElementById('sky-status-main');
    const metaEl = document.getElementById('sky-status-meta');
    const panelStatus = document.getElementById('sky-panel-status');

    if (mainEl && typeof mainText === 'string') {
        mainEl.textContent = mainText;
    }

    if (metaEl && typeof metaText === 'string') {
        metaEl.textContent = metaText;
    }

    if (panelStatus) {
        panelStatus.dataset.tone = tone;
    }
}

function getSkyPanelBounds(visibleWidth, visibleHeight) {
    return {
        minWidth: Math.min(Math.max(320, visibleWidth * 0.42), Math.max(280, visibleWidth - 20)),
        maxWidth: Math.max(320, visibleWidth - 20),
        minHeight: Math.min(Math.max(240, visibleHeight * 0.34), Math.max(220, visibleHeight - 20)),
        maxHeight: Math.max(240, visibleHeight - 20)
    };
}

function getSkyStageMetrics() {
    const stage = document.querySelector('.map-stage');

    if (!stage) return null;

    const stageRect = stage.getBoundingClientRect();
    const visibleLeft = Math.max(0, -stageRect.left);
    const visibleTop = Math.max(0, -stageRect.top);
    const visibleWidth = Math.max(260, Math.min(stageRect.width - visibleLeft, window.innerWidth - Math.max(stageRect.left, 0)));
    const visibleHeight = Math.max(220, Math.min(stageRect.height - visibleTop, window.innerHeight - Math.max(stageRect.top, 0)));
    const margin = stageRect.width <= 600 ? 10 : (stageRect.width <= 900 ? 14 : 28);

    return {
        stageRect,
        visibleLeft,
        visibleTop,
        visibleWidth,
        visibleHeight,
        margin,
        bounds: getSkyPanelBounds(visibleWidth - margin * 2, visibleHeight - margin * 2)
    };
}

function getSkyBasePanelSize(metrics) {
    if (!metrics) return null;

    const { visibleWidth, maxPanelWidth, maxPanelHeight } = {
        visibleWidth: metrics.visibleWidth,
        maxPanelWidth: metrics.bounds.maxWidth,
        maxPanelHeight: metrics.bounds.maxHeight
    };

    const preferredWidth = visibleWidth <= 600
        ? Math.min(maxPanelWidth, Math.max(300, visibleWidth * 0.78))
        : Math.min(maxPanelWidth, Math.max(380, visibleWidth * 0.6));
    const preferredHeight = Math.min(
        maxPanelHeight,
        Math.max(visibleWidth <= 600 ? 240 : 320, preferredWidth / 1.4)
    );

    return { width: preferredWidth, height: preferredHeight };
}

function getSkyPreferredPanelSize(metrics) {
    const baseSize = getSkyBasePanelSize(metrics);
    if (!baseSize) return null;

    return clampSkyPanelSize({
        width: baseSize.width * (SKY_PANEL_DEFAULT_SCALE / 100),
        height: baseSize.height * (SKY_PANEL_DEFAULT_SCALE / 100)
    }, metrics.bounds);
}

function clampSkyPanelSize(size, bounds) {
    if (!size || !bounds) return null;

    return {
        width: Math.min(bounds.maxWidth, Math.max(bounds.minWidth, size.width)),
        height: Math.min(bounds.maxHeight, Math.max(bounds.minHeight, size.height))
    };
}

function getSkyPanelScaleValue(currentSize, baseSize) {
    if (!currentSize || !baseSize) return SKY_PANEL_DEFAULT_SCALE;

    const widthRatio = currentSize.width / baseSize.width;
    const heightRatio = currentSize.height / baseSize.height;
    const scale = Math.round(((widthRatio + heightRatio) * 0.5) * 100);

    return Math.min(SKY_PANEL_SCALE_MAX, Math.max(SKY_PANEL_SCALE_MIN, scale));
}

function updateSkySizeSlider(metrics = null) {
    const slider = document.getElementById('sky-panel-size-slider');
    if (!slider) return;

    const resolvedMetrics = metrics || getSkyStageMetrics();
    const baseSize = getSkyBasePanelSize(resolvedMetrics);
    const preferredSize = getSkyPreferredPanelSize(resolvedMetrics);
    const currentSize = skyUserPanelSize || preferredSize;

    slider.disabled = skyPanelCollapsed;
    slider.value = String(getSkyPanelScaleValue(currentSize, baseSize));
}

function applySkyPanelScale(scaleValue) {
    const metrics = getSkyStageMetrics();
    const baseSize = getSkyBasePanelSize(metrics);
    if (!metrics || !baseSize) return;

    const safeScale = Math.min(SKY_PANEL_SCALE_MAX, Math.max(SKY_PANEL_SCALE_MIN, Number(scaleValue) || SKY_PANEL_SCALE_DEFAULT));
    const ratio = safeScale / 100;
    skyUserPanelSize = clampSkyPanelSize({
        width: baseSize.width * ratio,
        height: baseSize.height * ratio
    }, metrics.bounds);

    updateSkyObserverLayout();
    syncVirtualSkySize(true);
    renderSkyStarOverlay();
}

function syncVirtualSkySize(force = false) {
    const panelBody = document.querySelector('.sky-panel-body');
    if (!virtualsky || !panelBody) return false;

    const nextWidth = Math.round(panelBody.clientWidth);
    const nextHeight = Math.round(panelBody.clientHeight);

    if (nextWidth <= 0 || nextHeight <= 0) return false;

    const changed = force || nextWidth !== skyLastPanelSize.width || nextHeight !== skyLastPanelSize.height;
    if (!changed) return false;

    skyLastPanelSize = { width: nextWidth, height: nextHeight };

    if (typeof virtualsky.resize === 'function') {
        virtualsky.resize(nextWidth, nextHeight);
    } else if (typeof virtualsky.draw === 'function') {
        virtualsky.draw();
    }

    return true;
}






// 星盘
function syncSkyFusionModeUI() {
    const panel = document.getElementById('sky-panel');

    if (panel) {
        panel.classList.toggle('is-fused', skyFusionMode);
    }

    scheduleSkyObserverLayout();
}

function refreshSkyStatus() {
    if (skyPanelCollapsed) {
        updateSkyPanelStatus(t('skyStatusCollapsedMain'), t('skyStatusCollapsedMeta'), 'normal');
        return;
    }

    const facingLabel = map ? getFacingLabel(map.getBearing()) : (currentLanguage === 'en' ? 'S · 180°' : '南 · 180°');
    const activeName = getActiveSkyStarName();
    const activeMarker = activeName ? document.querySelector(`.sky-star-marker[data-star-name="${activeName}"]`) : null;

    if (skyState.approxCount > 0) {
        updateSkyPanelStatus(
            t('skyStatusHiddenLabelsMain', { count: skyState.approxCount }),
            t('skyStatusHiddenLabelsMeta', { facing: facingLabel }),
            'warn'
        );
        return;
    }

    if (activeMarker) {
        const mode = skyState.lockedStar ? t('locked') : t('preview');
        const relatedState = getDisplayStateLabel(activeMarker.dataset.state || '未详');
        updateSkyPanelStatus(
            t('skyStatusActiveMain', {
                mode,
                name: getDisplayStarLabel(activeMarker.dataset.starName),
                symbol: getDisplaySymbolLabel(activeMarker.dataset.symbol)
            }),
            t('skyStatusActiveMeta', {
                state: relatedState,
                azimuth: activeMarker.dataset.azimuth,
                facing: facingLabel
            }),
            'active'
        );
        return;
    }

    updateSkyPanelStatus(t('skyStatusDefaultMain'), t('skyStatusDefaultMeta', { facing: facingLabel }), 'normal');
}

function syncObserverAnchorVisibility(forceVisible) {
    const anchor = document.getElementById('observer-anchor');
    if (!anchor) return;

    const shouldShow = typeof forceVisible === 'boolean' ? forceVisible : !skyPanelCollapsed;
    anchor.style.display = shouldShow ? 'block' : 'none';
    anchor.setAttribute('aria-hidden', String(!shouldShow));
}

function updateSkyObserverLayout() {
    if (!map) return;

    const panel = document.getElementById('sky-panel');
    const anchor = document.getElementById('observer-anchor');
    const metrics = getSkyStageMetrics();

    if (!panel || !anchor || !metrics) return;

    syncObserverAnchorVisibility(!skyPanelCollapsed);
    if (skyPanelCollapsed) return;

    const projected = map.project(CONFIG.changan);
    const preferredSize = getSkyPreferredPanelSize(metrics);
    const panelSize = skyUserPanelSize
        ? clampSkyPanelSize(skyUserPanelSize, metrics.bounds)
        : preferredSize;
    const panelWidth = panelSize.width;
    const panelHeight = panelSize.height;
    const minX = metrics.visibleLeft + metrics.margin + panelWidth * 0.5;
    const maxX = metrics.visibleLeft + metrics.visibleWidth - metrics.margin - panelWidth * 0.5;
    const minY = metrics.visibleTop + metrics.margin + panelHeight;
    const maxY = metrics.visibleTop + metrics.visibleHeight - metrics.margin;
    const clampedX = Math.min(Math.max(projected.x, minX), maxX);
    const clampedY = Math.min(Math.max(projected.y - 22, minY), maxY);

    skyUserPanelSize = skyUserPanelSize ? panelSize : null;
    panel.style.width = `${panelWidth}px`;
    panel.style.height = `${panelHeight}px`;
    anchor.style.left = `${projected.x}px`;
    anchor.style.top = `${projected.y}px`;
    panel.style.left = `${clampedX}px`;
    panel.style.top = `${clampedY}px`;
    panel.classList.toggle('is-compact', panelWidth < 520 || panelHeight < 340);
    updateSkySizeSlider(metrics);

    if (syncVirtualSkySize()) {
        scheduleSkyOverlayRender();
    }
}

function isSkyLabelVisible(xy, skyBody) {
    if (!xy || !Number.isFinite(xy.x) || !Number.isFinite(xy.y) || !skyBody) {
        return false;
    }

    const edgePadding = Math.max(6, Math.min(skyBody.clientWidth, skyBody.clientHeight) * 0.02);
    const domeRadius = Math.min(skyBody.clientWidth, skyBody.clientHeight) * 0.5 - edgePadding;
    const domeCenterX = skyBody.clientWidth * 0.5;
    const domeCenterY = skyBody.clientHeight * 0.5;
    const domeDx = xy.x - domeCenterX;
    const domeDy = xy.y - domeCenterY;
    const insideDome = ((domeDx * domeDx) + (domeDy * domeDy)) <= (domeRadius * domeRadius);

    return insideDome;
}

function focusSkyOnStar(starName, options = {}) {
    const normalizedStarName = normalizeStarName(starName);
    if (!normalizedStarName || !virtualsky) return false;

    const feature = getStarFeatureByName(normalizedStarName);
    const targetAzimuth = Number(feature?.properties?.['方位角']);
    if (!Number.isFinite(targetAzimuth)) return false;

    const anchor = SKY_LABEL_ANCHORS[normalizedStarName];
    if (anchor) {
        const targetRA = anchor.ra;
        const longitude = virtualsky.longitude || CONFIG.changan[0];
        
        let targetGMST = (targetRA - longitude + targetAzimuth - 180) % 360;
        if (targetGMST < 0) targetGMST += 360;
        
        let targetD = (targetGMST - 280.46061837) / 360.985647366;
        while (targetD < 0) targetD += (360 / 360.985647366);
        
        const J2000_MS = 946728000000;
        virtualsky.clock = new Date(J2000_MS + targetD * 86400000);
    }

    if (typeof virtualsky.draw === 'function') {
        virtualsky.draw();
    }

    scheduleSkyOverlayRender();
    return true;
}

function setSkyHover(starName) {
    if (skyState.lockedStar) return;
    skyState.hoveredStar = starName || null;
    updateSkyVisualState();
}

function setSkyLock(starName, options = {}) {
    const normalizedStarName = normalizeStarName(starName);
    skyState.lockedStar = normalizedStarName || null;
    if (skyState.lockedStar) {
        skyState.hoveredStar = null;
        if (options.focus !== false) {
            focusSkyOnStar(skyState.lockedStar, options);
        }
    }
    updateSkyVisualState();
}

function clearSkyState() {
    skyState.hoveredStar = null;
    skyState.lockedStar = null;
    updateSkyVisualState();
}

function updateSkyVisualState() {
    const activeStarName = getActiveSkyStarName();
    highlightSkyStar(activeStarName, { preview: !skyState.lockedStar && !!skyState.hoveredStar });
    refreshSkyStatus();
}


function initMap() {
    map = new maplibregl.Map({
        container: 'map',
        style: {
            version: 8,
            sources: {},
            layers: [{
                id: 'background',
                type: 'background',
                paint: { 'background-color': '#0a1628' }
            }],
            projection: { type: 'mercator' }
        },
        center: CONFIG.map.center,
        zoom: CONFIG.map.zoom,
        pitch: CONFIG.map.pitch,
        bearing: CONFIG.map.bearing,
        maxZoom: CONFIG.map.maxZoom,
        minZoom: CONFIG.map.minZoom,
        pitchWithRotate: false,
        attributionControl: false
    });

    if (typeof map.setMinPitch === 'function') {
        map.setMinPitch(CONFIG.map.pitch);
    }

    if (typeof map.setMaxPitch === 'function') {
        map.setMaxPitch(CONFIG.map.pitch);
    }

    map.on('load', async () => {
        console.log('地图加载完成');
        await addDataSources();
        addLayers();
        initVirtualSky();
        scheduleSkyObserverLayout();
        renderSkyStarOverlay();
        addInteractions();
        hideLoadingIndicator();
        dataLoaded = true;
    });

    map.on('idle', () => {
        scheduleSkyObserverLayout();
        scheduleSkyOverlayRender();
    });

    map.on('move', () => {
        scheduleSkyObserverLayout();
    });

    map.on('rotate', () => {
        syncSkyHeadingToMap();
        refreshSkyStatus();
    });

    map.on('error', (e) => {
        console.error('地图错误:', e.error);
    });
}

function initVirtualSky() {
    const container = document.getElementById('virtualsky-container');
    if (!container) return;
    
    try {
        virtualsky = S.virtualsky({
            id: 'virtualsky-container',
            projection: 'polar',
            longitude: CONFIG.changan[0],
            latitude: 90,
            az: 180,
            fullsky: true,
            constellations: true,
            lines: true,
            constellationlabels: true,
            live: false,
            showdate: false,
            showposition: false,
            showstars: true,
            showstarlabels: false,
            keyboard: false,
            mouse: true,
            magnitude: 5,
            gradient: false,
            transparent: true,
            ground: false,
            gridlines_az: false,
            gridlines_eq: true,
            ecliptic: true,
            showequator: true,
            color_grid: 'rgba(255, 209, 102, 0.25)',
            eclipticcolor: 'rgba(255, 215, 102, 0.6)',
            equatorcolor: 'rgba(255, 107, 137, 0.6)',
            meridian: false,
            cardinalpoints: false,
            background: 'rgba(0,0,0,0)',
            credit: false
        });

        window.virtualskyInstance = virtualsky;
        ensureObserverHeadingBaseline();

        // 扩展极地投影视角：从天顶(90°)下延至赤纬-55°，以包含所有二十八宿(尤其是南方星宿如尾、箕等)
        window.skyZoomLevel = window.skyZoomLevel || 1.0;
        if (virtualsky.projections && virtualsky.projections['polar']) {
            virtualsky.projections['polar'].atmos = false; // 关闭大气边缘星微光衰减
            virtualsky.projections['polar'].azel2xy = function(az, el, w, h) {
                const radius = Math.min(w, h) / 2;
                const range = (145 * Math.PI / 180) / window.skyZoomLevel; // 应用缩放级别
                const r = radius * ((Math.PI / 2) - el) / range;
                return { x: (w/2 - r * Math.sin(az)), y: (h/2 - r * Math.cos(az)), el: el };
            };
            virtualsky.projections['polar'].xy2azel = function(x, y, w, h) {
                const radius = Math.min(w, h) / 2;
                const X = w/2 - x;
                const Y = h/2 - y;
                const r = Math.sqrt(X * X + Y * Y);
                const range = (145 * Math.PI / 180) / window.skyZoomLevel;
                const el = (Math.PI / 2) - r * range / radius;
                const az = Math.atan2(X, Y);
                return [az, el];
            };
        }

        if (typeof virtualsky.selectProjection === 'function') {
            virtualsky.selectProjection('polar');
            if (typeof virtualsky.draw === 'function') {
                virtualsky.draw();
            }
        }

        syncVirtualSkySize(true);

        syncMapHeadingToSky(true);

        startSkyOverlayTracking();
        syncSkyFusionModeUI();
        scheduleSkyObserverLayout();
        refreshSkyStatus();

        console.log('虚拟天球加载完成');
    } catch (error) {
        console.error('虚拟天球加载失败:', error);
    }
}


async function addDataSources() {
    try {
        const [starsResponse, statesResponse, linesResponse] = await Promise.all([
            fetch('./data/stars.geojson'),
            fetch('./data/states.geojson'),
            fetch('./data/lines.geojson')
        ]);

        [starsGeoJson, statesGeoJson, linesGeoJson] = await Promise.all([
            starsResponse.json(),
            statesResponse.json(),
            linesResponse.json()
        ]);

        enrichAnalysisData();
        localizeMapDataLabels();

        map.addSource('basemap', {
            type: 'image',
            url: './data/basemap.png',
            coordinates: [
                [85, 50],      // 西北角 (东经85°, 北纬50°)
                [133, 50],     // 东北角 (东经133°, 北纬50°)
                [133, 18],     // 东南角 (东经133°, 南纬18°)
                [85, 18]       // 西南角 (东经85°, 南纬18°)
            ]
        });

        map.addSource('stars', {
            type: 'geojson',
            data: starsGeoJson,
            generateId: true
        });

        map.addSource('analysis-sectors', {
            type: 'geojson',
            data: analysisSectorGeoJson
        });

        map.addSource('comparison-lines', {
            type: 'geojson',
            data: comparisonLinesGeoJson,
            generateId: true
        });

        map.addSource('states', {
            type: 'geojson',
            data: statesGeoJson,
            generateId: true
        });

        map.addSource('fenye-lines', {
            type: 'geojson',
            data: linesGeoJson,
            generateId: true
        });

        console.log('数据源加载完成 (含底图)');
    } catch (error) {
        console.error('数据源加载失败:', error);
    }
}

function getSourceData(sourceName) {
    if (sourceName === 'stars') return starsGeoJson;
    if (sourceName === 'analysis-sectors') return analysisSectorGeoJson;
    if (sourceName === 'comparison-lines') return comparisonLinesGeoJson;
    if (sourceName === 'states') return statesGeoJson;
    if (sourceName === 'fenye-lines') return linesGeoJson;
    return null;
}

function getSourceFeatures(sourceName) {
    return getSourceData(sourceName)?.features || [];
}

function addLayers() {
    try {
        console.log('开始添加图层...');
        
        console.log('添加底图层...');
        map.addLayer({
            id: 'basemap-layer',
            type: 'raster',
            source: 'basemap',
            paint: {
                'raster-opacity': 0.7  // 透明度
            }
        });
        console.log('底图层添加成功');

        map.addLayer({
            id: 'analysis-sectors-fill',
            type: 'fill',
            source: 'analysis-sectors',
            paint: {
                'fill-color': [
                    'match', ['get', '四象'],
                    '苍龙', CONFIG.colors['苍龙'],
                    '朱雀', CONFIG.colors['朱雀'],
                    '白虎', CONFIG.colors['白虎'],
                    '玄武', CONFIG.colors['玄武'],
                    '#888888'
                ],
                'fill-opacity': 0.08
            }
        });

        map.addLayer({
            id: 'analysis-sectors-outline',
            type: 'line',
            source: 'analysis-sectors',
            paint: {
                'line-color': [
                    'match', ['get', '四象'],
                    '苍龙', CONFIG.colors['苍龙'],
                    '朱雀', CONFIG.colors['朱雀'],
                    '白虎', CONFIG.colors['白虎'],
                    '玄武', CONFIG.colors['玄武'],
                    '#888888'
                ],
                'line-width': 1,
                'line-opacity': 0.28,
                'line-dasharray': [2, 2]
            }
        });

        console.log('添加分野连线...');
        map.addLayer({
            id: 'fenye-lines',
            type: 'line',
            source: 'fenye-lines',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'highlight'], false],
                    '#fff2c4',
                    ['match', ['get', '对应分级'],
                        'aligned', '#59f0ff',
                        'slight', '#ffd166',
                        'significant', '#ff6b89',
                        '#ffd700'
                    ]
                ],
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'highlight'], false],
                    4,
                    2.2
                ],
                'line-dasharray': [3, 2],
                'line-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'highlight'], false],
                    1.0, 0.74
                ]
            }
        });
        console.log('分野连线添加成功');

        map.addLayer({
            id: 'comparison-lines',
            type: 'line',
            source: 'comparison-lines',
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
                visibility: 'none'
            },
            paint: {
                'line-color': [
                    'case',
                    ['boolean', ['feature-state', 'highlight'], false],
                    '#ffffff',
                    ['==', ['get', '比较状态'], 'changed'], '#ffc14d',
                    '#78d5e3'
                ],
                'line-width': [
                    'case',
                    ['boolean', ['feature-state', 'highlight'], false],
                    4.2,
                    ['==', ['get', '比较状态'], 'changed'], 2.8,
                    1.8
                ],
                'line-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'highlight'], false],
                    1,
                    ['==', ['get', '比较状态'], 'changed'], 0.95,
                    0.52
                ],
                'line-dasharray': [1.5, 1.6]
            }
        });

        console.log('添加星宿层...');
        map.addLayer({
            id: 'stars-layer',
            type: 'circle',
            source: 'stars',
            paint: {
                'circle-radius': [
                    'interpolate', ['linear'], ['zoom'],
                    2, 3, 6, 8, 8, 12
                ],
                'circle-color': [
                    'match', ['get', '四象'],
                    '苍龙', CONFIG.colors['苍龙'],
                    '朱雀', CONFIG.colors['朱雀'],
                    '白虎', CONFIG.colors['白虎'],
                    '玄武', CONFIG.colors['玄武'],
                    '#888888'
                ],
                'circle-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'highlight'], false],
                    1, 0.6
                ],
                'circle-stroke-width': [
                    'case',
                    ['boolean', ['feature-state', 'hover'], false],
                    2, 1
                ],
                'circle-stroke-color': '#ffffff'
            }
        });

        console.log('✓ 星宿层添加成功');

        map.addLayer({
            id: 'stars-label',
            type: 'symbol',
            source: 'stars',
            layout: {
                'text-field': ['get', 'displayLabel'],
                'text-size': [
                    'interpolate', ['linear'], ['zoom'],
                    2, 8, 6, 11, 8, 14
                ],
                'text-offset': [0, 1.5],
                'text-allow-overlap': false,
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1.5,
                'text-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'highlight'], false],
                    1, 0.5
                ]
            }
        });

        map.addLayer({
            id: 'states-points',
            type: 'circle',
            source: 'states',
            paint: {
                'circle-radius': 0,
                'circle-opacity': 0
            }
        });

        map.addLayer({
            id: 'states-label',
            type: 'symbol',
            source: 'states',
            layout: {
                'text-field': ['get', 'displayLabel'],
                'text-size': [
                    'interpolate', ['linear'], ['zoom'],
                    3, 9, 6, 12
                ],
                'text-offset': [0, 0],
                'text-allow-overlap': false,
                'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
            },
            paint: {
                'text-color': '#ffd166',
                'text-halo-color': '#000000',
                'text-halo-width': 2,
                'text-opacity': [
                    'case',
                    ['boolean', ['feature-state', 'highlight'], false],
                    1, 0.4
                ]
            }
        });

        console.log('图层添加成功');
        syncAnalysisFilters();
    } catch (error) {
        console.error('图层添加失败:', error);
        console.error('错误详情:', error.message);
    }
}

function addInteractions() {
    map.on('click', 'stars-layer', handleStarClick);
    map.on('click', 'states-points', handleStateClick);
    map.on('click', 'states-label', handleStateClick);
    map.on('click', 'fenye-lines', handleLineClick);
    map.on('click', 'comparison-lines', handleComparisonLineClick);
    
    map.on('mouseenter', 'stars-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'stars-layer', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'states-points', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'states-points', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'states-label', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'states-label', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'fenye-lines', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'fenye-lines', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('mouseenter', 'comparison-lines', () => {
        map.getCanvas().style.cursor = 'pointer';
    });

    map.on('mouseleave', 'comparison-lines', () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['stars-layer', 'states-points', 'states-label', 'fenye-lines', 'comparison-lines'] });
        if (features.length === 0) {
            clearHighlight();
            document.querySelectorAll('.maplibregl-popup').forEach(p => p.remove());
        }
    });

    console.log('交互事件已绑定');
}

function handleStarClick(e) {
    const feature = e.features[0];
    const properties = feature.properties;
    const coordinates = feature.geometry.coordinates.slice();

    const relatedState = properties['分野州郡'];
    const starName = normalizeStarName(properties['星宿名']);

    clearHighlight();

    const starsFeatures = getSourceFeatures('stars');
    const statesFeatures = getSourceFeatures('states');
    const linesFeatures = getSourceFeatures('fenye-lines');

    if (starsFeatures.length > 0) {
        const idx = getFeatureIndex(starsFeatures, (f) => normalizeStarName(f.properties['星宿名']) === starName);
        if (idx >= 0) map.setFeatureState({ source: 'stars', id: idx }, { highlight: true });
    }

    if (linesFeatures.length > 0) {
        const idx = getFeatureIndex(linesFeatures, (f) => normalizeStarName(f.properties['星宿']) === starName);
        if (idx >= 0) map.setFeatureState({ source: 'fenye-lines', id: idx }, { highlight: true });
    }

    if (statesFeatures.length > 0) {
        const idx = getFeatureIndex(statesFeatures, (f) => normalizeStateName(f.properties['州郡名']) === normalizeStateName(relatedState));
        if (idx >= 0) map.setFeatureState({ source: 'states', id: idx }, { highlight: true });
    }

    currentHighlight = { type: 'star', starName, state: relatedState };
    setSkyLock(starName);
    
    // Always fly map back to Chang'an, facing the star's azimuth
    const targetAzimuth = properties['方位角'];
    if (targetAzimuth !== undefined && map) {
        map.flyTo({ center: CONFIG.changan, bearing: targetAzimuth, zoom: 6, duration: 1200, essential: true });
    }
    
    showStarPopup(coordinates, properties);
}

function handleStateClick(e) {
    const feature = e.features[0];
    const properties = feature.properties;
    const coordinates = feature.geometry.coordinates.slice();

    const stateName = normalizeStateName(properties['州郡名']);
    const relatedStar = normalizeStarName(getFirstStarName(properties['分野星宿']));

    clearHighlight();

    const starsFeatures = getSourceFeatures('stars');
    const statesFeatures = getSourceFeatures('states');
    const linesFeatures = getSourceFeatures('fenye-lines');

    if (statesFeatures.length > 0) {
        const idx = getFeatureIndex(statesFeatures, (f) => normalizeStateName(f.properties['州郡名']) === stateName);
        if (idx >= 0) map.setFeatureState({ source: 'states', id: idx }, { highlight: true });
    }

    if (linesFeatures.length > 0) {
        linesFeatures.forEach((lineFeature, idx) => {
            if (normalizeStateName(lineFeature.properties['州郡']) === stateName) {
                map.setFeatureState({ source: 'fenye-lines', id: idx }, { highlight: true });
            }
        });
    }

    if (starsFeatures.length > 0) {
        const idx = getFeatureIndex(starsFeatures, (f) => normalizeStarName(f.properties['星宿名']) === relatedStar);
        if (idx >= 0) map.setFeatureState({ source: 'stars', id: idx }, { highlight: true });
    }

    currentHighlight = { type: 'state', stateName: properties['州郡名'], star: properties['分野星宿'] };
    setSkyLock(relatedStar);
    
    // Always fly map back to Chang'an, facing the state's azimuth
    const targetAzimuth = properties['中心方位角'];
    if (targetAzimuth !== undefined && map) {
        map.flyTo({ center: CONFIG.changan, bearing: targetAzimuth, zoom: 6, duration: 1200, essential: true });
    }

    showStatePopup(coordinates, properties);
}

function handleLineClick(e) {
    const feature = e.features[0];
    const properties = feature.properties;
    const starName = normalizeStarName(properties['星宿']);
    const stateName = normalizeStateName(properties['州郡']);
    const lineCoordinates = getLineMidpoint(feature);

    clearHighlight();

    const starsFeatures = getSourceFeatures('stars');
    const statesFeatures = getSourceFeatures('states');
    const linesFeatures = getSourceFeatures('fenye-lines');

    if (starsFeatures.length > 0) {
        const starIndex = getFeatureIndex(starsFeatures, (starFeature) => normalizeStarName(starFeature.properties['星宿名']) === starName);
        if (starIndex >= 0) map.setFeatureState({ source: 'stars', id: starIndex }, { highlight: true });
    }

    if (statesFeatures.length > 0) {
        const stateIndex = getFeatureIndex(statesFeatures, (stateFeature) => normalizeStateName(stateFeature.properties['州郡名']) === stateName);
        if (stateIndex >= 0) map.setFeatureState({ source: 'states', id: stateIndex }, { highlight: true });
    }

    if (linesFeatures.length > 0) {
        const lineIndex = getFeatureIndex(linesFeatures, (lineFeature) => normalizeStarName(lineFeature.properties['星宿']) === starName && normalizeStateName(lineFeature.properties['州郡']) === stateName);
        if (lineIndex >= 0) map.setFeatureState({ source: 'fenye-lines', id: lineIndex }, { highlight: true });
    }

    currentHighlight = { type: 'line', starName: properties['星宿'], stateName: properties['州郡'] };
    setSkyLock(properties['星宿']);
    
    const starFeature = starsFeatures.find(f => normalizeStarName(f.properties['星宿名']) === starName);
    if (starFeature && starFeature.properties['方位角'] !== undefined && map) {
        map.flyTo({ center: CONFIG.changan, bearing: starFeature.properties['方位角'], zoom: 6, duration: 1200, essential: true });
    }

    showLinePopup(lineCoordinates, properties);
}

function handleComparisonLineClick(e) {
    const feature = e.features[0];
    const properties = feature.properties;
    const starName = normalizeStarName(properties['星宿']);
    const stateName = normalizeStateName(properties['州郡']);
    const lineCoordinates = getLineMidpoint(feature);

    clearHighlight();

    const starsFeatures = getSourceFeatures('stars');
    const statesFeatures = getSourceFeatures('states');
    const comparisonFeatures = getSourceFeatures('comparison-lines');

    if (starsFeatures.length > 0) {
        const starIndex = getFeatureIndex(starsFeatures, (starFeature) => normalizeStarName(starFeature.properties['星宿名']) === starName);
        if (starIndex >= 0) map.setFeatureState({ source: 'stars', id: starIndex }, { highlight: true });
    }

    if (statesFeatures.length > 0) {
        const stateIndex = getFeatureIndex(statesFeatures, (stateFeature) => normalizeStateName(stateFeature.properties['州郡名']) === stateName);
        if (stateIndex >= 0) map.setFeatureState({ source: 'states', id: stateIndex }, { highlight: true });
    }

    if (comparisonFeatures.length > 0) {
        const lineIndex = getFeatureIndex(comparisonFeatures, (lineFeature) => normalizeStarName(lineFeature.properties['星宿']) === starName && normalizeStateName(lineFeature.properties['州郡']) === stateName);
        if (lineIndex >= 0) map.setFeatureState({ source: 'comparison-lines', id: lineIndex }, { highlight: true });
    }

    currentHighlight = { type: 'compare-line', starName: properties['星宿'], stateName: properties['州郡'] };
    setSkyLock(properties['星宿']);
    
    const starFeature = starsFeatures.find(f => normalizeStarName(f.properties['星宿名']) === starName);
    if (starFeature && starFeature.properties['方位角'] !== undefined && map) {
        map.flyTo({ center: CONFIG.changan, bearing: starFeature.properties['方位角'], zoom: 6, duration: 1200, essential: true });
    }

    showLinePopup(lineCoordinates, properties);
}

function clearHighlight() {
    if (!map || !dataLoaded) return;

    const starsFeatures = getSourceFeatures('stars');
    const statesFeatures = getSourceFeatures('states');
    const linesFeatures = getSourceFeatures('fenye-lines');
    const comparisonFeatures = getSourceFeatures('comparison-lines');

    if (starsFeatures.length > 0) {
        starsFeatures.forEach((f, idx) => {
            map.setFeatureState({ source: 'stars', id: idx }, { highlight: false });
        });
    }

    if (statesFeatures.length > 0) {
        statesFeatures.forEach((f, idx) => {
            map.setFeatureState({ source: 'states', id: idx }, { highlight: false });
        });
    }

    if (linesFeatures.length > 0) {
        linesFeatures.forEach((f, idx) => {
            map.setFeatureState({ source: 'fenye-lines', id: idx }, { highlight: false });
        });
    }

    if (comparisonFeatures.length > 0) {
        comparisonFeatures.forEach((f, idx) => {
            map.setFeatureState({ source: 'comparison-lines', id: idx }, { highlight: false });
        });
    }

    currentHighlight = null;
    skyState.hoveredStar = null;
    skyState.lockedStar = null;
    highlightSkyStar(null);
    hideInfoPanel();
    refreshSkyStatus();
}

function updateMapView(chapterId) {
    if (!map || !CONFIG.chapters[chapterId]) return;

    const view = CONFIG.chapters[chapterId];

    map.flyTo({
        center: view.center,
        zoom: view.zoom,
        pitch: view.pitch,
        bearing: view.bearing,
        duration: 1500,
        essential: true
    });

    console.log(`→ 地图切换: ${chapterId}`);
}

function applyFilter(filter) {
    currentFilter = filter;
    analysisState.symbol = filter;

    clearHighlight();
    syncSkyFilter(filter);
    syncAnalysisFilters();
    refreshSkyStatus();
    console.log(`✓ 筛选: ${filter}`);
}

function hideLoadingIndicator() {
    const indicator = document.querySelector('.loading-indicator');
    if (!indicator) return;

    indicator.style.opacity = '0';
    indicator.style.pointerEvents = 'none';

    setTimeout(() => {
        indicator.style.display = 'none';
    }, 300);
}

function renderSkyStarOverlay() {
    const overlay = document.getElementById('sky-star-overlay');
    const skyBody = document.querySelector('.sky-panel-body');
    const starsData = getSourceData('stars');

    if (!overlay || !skyBody || !starsData?.features) return;

    if (skyBody.clientWidth === 0 || skyBody.clientHeight === 0) return;

    overlay.innerHTML = '';

    const focus = document.createElement('div');
    focus.className = 'sky-star-focus';
    focus.innerHTML = `
        <div class="sky-star-focus-ring"></div>
        <svg class="sky-star-focus-beam" aria-hidden="true">
            <defs>
                <marker id="sky-focus-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto" markerUnits="userSpaceOnUse">
                    <path d="M 0 0 L 10 5 L 0 10 z" class="sky-star-focus-arrow"></path>
                </marker>
            </defs>
            <path class="sky-star-focus-beam-path"></path>
        </svg>
        <div class="sky-star-focus-card"></div>
    `;
    overlay.appendChild(focus);

    const size = Math.min(skyBody.clientWidth, skyBody.clientHeight);
    const centerX = skyBody.clientWidth / 2;
    const centerY = skyBody.clientHeight / 2;
    const radius = size * 0.37;

    starsData.features.forEach((feature, index) => {
        const starName = feature.properties['星宿名'];
        const color = CONFIG.colors[feature.properties['四象']] || '#ffffff';
        const azimuth = Number(feature.properties['方位角']) || 0;
        const radians = (azimuth - 90) * Math.PI / 180;
        const radialOffset = ((index % 3) - 1) * (size * 0.065);
        const labelRadius = radius + radialOffset;
        const x = centerX + labelRadius * Math.cos(radians);
        const y = centerY + labelRadius * Math.sin(radians);

        const marker = document.createElement('button');
        marker.type = 'button';
        marker.className = 'sky-star-marker';
        marker.dataset.starName = starName;
        marker.dataset.symbol = feature.properties['四象'];
        marker.dataset.state = feature.properties['分野州郡'] || '';
        marker.dataset.azimuth = `${Number(feature.properties['方位角'] || 0).toFixed(2)}°`;
        marker.dataset.fallbackLeft = `${x}`;
        marker.dataset.fallbackTop = `${y}`;
        marker.style.setProperty('--star-color', color);
        marker.style.left = `${x}px`;
        marker.style.top = `${y}px`;
        marker.style.zIndex = String(100 + index);
        marker.setAttribute('aria-label', `${getDisplayStarLabel(starName)}, ${getDisplaySymbolLabel(feature.properties['四象'])}, ${t('popupFenye')} ${getDisplayStateLabel(feature.properties['分野州郡'] || '未详')}`);
        marker.textContent = getDisplayStarLabel(starName);
        marker.addEventListener('mouseenter', () => {
            setSkyHover(starName);
        });
        marker.addEventListener('mouseleave', () => {
            if (skyState.hoveredStar === starName) {
                setSkyHover(null);
            }
        });
        marker.addEventListener('focus', () => {
            setSkyHover(starName);
        });
        marker.addEventListener('blur', () => {
            if (skyState.hoveredStar === starName) {
                setSkyHover(null);
            }
        });
        marker.addEventListener('click', (event) => {
            event.stopPropagation();
            handleStarClick({ features: [feature] });
        });

        overlay.appendChild(marker);
    });

    updateSkyStarOverlayPositions();
    syncSkyFilter(currentFilter);
    updateSkyVisualState();
}

function updateSkyStarOverlayPositions() {
    const skyBody = document.querySelector('.sky-panel-body');
    if (!virtualsky || !skyBody) return;

    const markers = document.querySelectorAll('.sky-star-marker');
    if (markers.length === 0) return;

    let approxCount = 0;

    markers.forEach((marker) => {
        const anchor = SKY_LABEL_ANCHORS[marker.dataset.starName];

        if (!anchor || typeof virtualsky.radec2xy !== 'function') {
            marker.hidden = true;
            marker.setAttribute('aria-hidden', 'true');
            approxCount += 1;
            return;
        }

        let xy = null;

        try {
            xy = virtualsky.radec2xy(anchor.ra * virtualsky.d2r, anchor.dec * virtualsky.d2r);
        } catch (error) {
            xy = null;
        }

        if (!isSkyLabelVisible(xy, skyBody)) {
            marker.hidden = true;
            marker.setAttribute('aria-hidden', 'true');
            approxCount += 1;
            return;
        }

        marker.hidden = false;
        marker.setAttribute('aria-hidden', 'false');
        marker.style.left = `${xy.x}px`;
        marker.style.top = `${xy.y}px`;
        marker.dataset.anchorSide = xy.x > skyBody.clientWidth * 0.74
            ? 'left'
            : (xy.y < skyBody.clientHeight * 0.2 ? 'top' : 'right');
        marker.classList.remove('is-approximate');
    });

    skyState.approxCount = approxCount;

    updateSkyVisualState();
}

function startSkyOverlayTracking() {
    if (skyOverlayAnimationFrame !== null) return;

    skyTrackLastTime = 0;

    const tick = (timestamp) => {
        if (!skyPanelCollapsed && (timestamp - skyTrackLastTime) >= SKY_TRACKING_FRAME_MS) {
            syncMapHeadingToSky();
            updateSkyStarOverlayPositions();
            skyTrackLastTime = timestamp;
        }

        skyOverlayAnimationFrame = requestAnimationFrame(tick);
    };

    skyOverlayAnimationFrame = requestAnimationFrame(tick);
}

function stopSkyOverlayTracking() {
    if (skyOverlayAnimationFrame === null) return;
    cancelAnimationFrame(skyOverlayAnimationFrame);
    skyOverlayAnimationFrame = null;
}

function highlightSkyStar(starName, options = {}) {
    const { preview = false } = options;
    let activeMarker = null;

    document.querySelectorAll('.sky-star-marker').forEach((marker) => {
        const isActive = marker.dataset.starName === starName && !marker.hidden;
        marker.classList.toggle('is-highlighted', isActive);
        marker.classList.toggle('is-hovered', preview && isActive);
        if (isActive) {
            activeMarker = marker;
        }
    });

    const focus = document.querySelector('.sky-star-focus');
    if (!focus) return;

    if (!activeMarker) {
        focus.classList.remove('is-visible');
        return;
    }

    const left = parseFloat(activeMarker.style.left);
    const top = parseFloat(activeMarker.style.top);
    const panelBody = document.querySelector('.sky-panel-body');
    const overlay = document.getElementById('sky-star-overlay');
    if (!panelBody || !overlay || Number.isNaN(left) || Number.isNaN(top)) return;

    const card = focus.querySelector('.sky-star-focus-card');
    const beam = focus.querySelector('.sky-star-focus-beam');
    const beamPath = focus.querySelector('.sky-star-focus-beam-path');
    const bodyWidth = panelBody.clientWidth;
    const bodyHeight = panelBody.clientHeight;
    const placeCardLeft = left < bodyWidth * 0.5;
    const cardWidth = Math.min(164, Math.max(132, bodyWidth * 0.34));
    const cardHeight = 68;
    const cardLeft = placeCardLeft ? Math.min(bodyWidth - cardWidth - 12, left + 44) : Math.max(12, left - cardWidth - 44);
    const cardTop = Math.max(12, Math.min(bodyHeight - cardHeight - 12, top - cardHeight * 0.5));
    const endX = placeCardLeft ? cardLeft - left : cardLeft + cardWidth - left;
    const endY = cardTop + cardHeight * 0.5 - top;
    const minX = Math.min(0, endX);
    const minY = Math.min(0, endY);
    const maxX = Math.max(0, endX);
    const maxY = Math.max(0, endY);
    const beamPad = 18;
    const beamWidth = maxX - minX + beamPad * 2;
    const beamHeight = maxY - minY + beamPad * 2;
    const startLocalX = beamPad - minX;
    const startLocalY = beamPad - minY;
    const endLocalX = endX - minX + beamPad;
    const endLocalY = endY - minY + beamPad;
    const controlX = startLocalX + (endLocalX - startLocalX) * 0.5;
    const curveLift = Math.max(26, Math.abs(endX) * 0.16);
    const controlY = Math.min(startLocalY, endLocalY) - curveLift;

    focus.style.left = `${left}px`;
    focus.style.top = `${top}px`;
    focus.style.setProperty('--focus-color', getComputedStyle(activeMarker).getPropertyValue('--star-color').trim() || '#ffd166');

    beam.style.width = `${beamWidth}px`;
    beam.style.height = `${beamHeight}px`;
    beam.style.left = `${minX - beamPad}px`;
    beam.style.top = `${minY - beamPad}px`;
    beam.setAttribute('viewBox', `0 0 ${beamWidth} ${beamHeight}`);
    beamPath.setAttribute('d', `M ${startLocalX} ${startLocalY} Q ${controlX} ${controlY} ${endLocalX} ${endLocalY}`);

    card.style.width = `${cardWidth}px`;
    card.style.left = `${cardLeft - left}px`;
    card.style.top = `${cardTop - top}px`;
    const modeLabel = preview ? t('preview') : t('locked');
    card.innerHTML = `
        <strong>${getDisplayStarLabel(activeMarker.dataset.starName)}</strong>
        <span>${modeLabel} · ${getDisplaySymbolLabel(activeMarker.dataset.symbol)} · ${t('popupFenye')} ${getDisplayStateLabel(activeMarker.dataset.state || '未详')}</span>
        <span>${t('panelAzimuth')} ${activeMarker.dataset.azimuth}</span>
    `;

    focus.classList.add('is-visible');
}

function syncSkyFilter(filter) {
    document.querySelectorAll('.sky-star-marker').forEach((marker) => {
        const shouldDim = filter !== 'all' && marker.dataset.symbol !== filter;
        marker.classList.toggle('is-dimmed', shouldDim);
    });

    updateSkyVisualState();
}

function toggleSkyPanel(forceExpanded) {
    const panel = document.getElementById('sky-panel');
    const fab = document.getElementById('sky-panel-fab');
    const reset = document.getElementById('sky-panel-reset');
    const toggle = document.getElementById('sky-panel-toggle');

    if (!panel || !fab) return;

    if (typeof forceExpanded === 'boolean') {
        skyPanelCollapsed = !forceExpanded;
    } else {
        skyPanelCollapsed = !skyPanelCollapsed;
    }

    if (!skyPanelCollapsed) {
        panel.style.display = 'flex';
    }

    panel.classList.toggle('is-collapsed', skyPanelCollapsed);
    if (toggle) {
        toggle.textContent = skyPanelCollapsed ? t('skyExpand') : t('skyCollapse');
    }
    fab.textContent = skyPanelCollapsed ? t('skyFabOpen') : t('skyFabCollapse');
    fab.classList.toggle('is-collapsed', skyPanelCollapsed);
    if (reset) {
        reset.disabled = skyPanelCollapsed;
    }
    syncObserverAnchorVisibility(!skyPanelCollapsed);
    if (toggle) {
        toggle.setAttribute('aria-expanded', String(!skyPanelCollapsed));
    }
    panel.setAttribute('aria-hidden', String(skyPanelCollapsed));
    fab.setAttribute('aria-expanded', String(!skyPanelCollapsed));

    if (skyPanelCollapsed) {
        stopSkyOverlayTracking();
        panel.style.display = 'none';
    } else {
        panel.style.display = 'flex';
        syncSkyFusionModeUI();
        startSkyOverlayTracking();
        requestAnimationFrame(() => {
            updateSkyObserverLayout();
            syncVirtualSkySize(true);
            renderSkyStarOverlay();
        });
    }

    refreshSkyStatus();
}

function setupUIEvents() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chapterId = btn.dataset.chapter;
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.chapter').forEach(ch => ch.classList.remove('active'));
            document.getElementById(chapterId).classList.add('active');
            
            updateMapView(chapterId);
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            applyFilter(filter);
        });
    });

    document.querySelectorAll('.analysis-filter-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const { group, value } = button.dataset;
            analysisState[group] = value;
            clearHighlight();
            syncAnalysisFilters();
        });
    });

    const methodToggle = document.getElementById('analysis-method-toggle');
    if (methodToggle) {
        methodToggle.addEventListener('click', () => {
            toggleMethodPanel();
        });
    }

    const methodClose = document.getElementById('analysis-method-close');
    if (methodClose) {
        methodClose.addEventListener('click', () => {
            toggleMethodPanel(false);
        });
    }

    const skyToggle = document.getElementById('sky-panel-toggle');
    if (skyToggle) {
        skyToggle.addEventListener('click', () => {
            toggleSkyPanel();
        });
    }

    const skyFab = document.getElementById('sky-panel-fab');
    if (skyFab) {
        skyFab.addEventListener('click', () => {
            toggleSkyPanel(skyPanelCollapsed);
        });
    }

    const skyReset = document.getElementById('sky-panel-reset');
    if (skyReset) {
        skyReset.addEventListener('click', () => {
            skyUserPanelSize = null;
            updateSkyObserverLayout();
            syncVirtualSkySize(true);
            renderSkyStarOverlay();
        });
    }

    const skyZoomIn = document.getElementById('sky-zoom-in');
    const skyZoomOut = document.getElementById('sky-zoom-out');
    const skyZoomResetBtn = document.getElementById('sky-zoom-reset');

    const updateSkyZoom = (delta) => {
        window.skyZoomLevel = Math.max(0.5, Math.min(3.0, window.skyZoomLevel * delta));
        if (virtualsky && typeof virtualsky.draw === 'function') {
            virtualsky.draw();
        }
        
        const hint = document.querySelector('.sky-horizon-hint');
        if (hint) {
            hint.style.opacity = window.skyZoomLevel > 1.05 || window.skyZoomLevel < 0.95 ? '0' : '1';
        }
        
        updateSkyStarOverlayPositions();
    };

    if (skyZoomIn) {
        skyZoomIn.addEventListener('click', () => updateSkyZoom(1.2));
    }
    if (skyZoomOut) {
        skyZoomOut.addEventListener('click', () => updateSkyZoom(1 / 1.2));
    }
    if (skyZoomResetBtn) {
        skyZoomResetBtn.addEventListener('click', () => {
            window.skyZoomLevel = 1.0;
            if (virtualsky && typeof virtualsky.draw === 'function') {
                virtualsky.draw();
            }
            
            const hint = document.querySelector('.sky-horizon-hint');
            if (hint) {
                hint.style.opacity = '1';
            }
            
            updateSkyStarOverlayPositions();
        });
    }

    // Add wheel event to panel
    const skyBodyRef = document.querySelector('.sky-panel-body');
    if (skyBodyRef) {
        skyBodyRef.addEventListener('wheel', (event) => {
            if (event.target.closest('.sky-panel-body')) {
                event.preventDefault();
                event.stopPropagation();
                // Check event deltaY
                if (event.deltaY < 0) {
                    updateSkyZoom(1.05); // zoom in
                } else {
                    updateSkyZoom(1 / 1.05); // zoom out
                }
            }
        }, { passive: false });
    }

    const skySizeSlider = document.getElementById('sky-panel-size-slider');
    if (skySizeSlider) {
        skySizeSlider.addEventListener('input', (event) => {
            applySkyPanelScale(event.target.value);
        });
    }

    const languageToggle = document.getElementById('language-toggle');
    if (languageToggle) {
        languageToggle.addEventListener('click', () => {
            applyLanguage(currentLanguage === 'zh' ? 'en' : 'zh');
        });
    }

    const resizeHandle = document.getElementById('sky-panel-resize-handle');
    const panel = document.getElementById('sky-panel');
    if (resizeHandle && panel) {
        resizeHandle.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            if (skyPanelCollapsed) return;

            const rect = panel.getBoundingClientRect();
            skyResizeDragState = {
                startX: event.clientX,
                startY: event.clientY,
                startWidth: rect.width,
                startHeight: rect.height
            };

            resizeHandle.setPointerCapture?.(event.pointerId);
            document.body.style.userSelect = 'none';
        });

        window.addEventListener('pointermove', (event) => {
            if (!skyResizeDragState || skyPanelCollapsed) return;

            const metrics = getSkyStageMetrics();
            if (!metrics) return;

            skyUserPanelSize = clampSkyPanelSize({
                width: skyResizeDragState.startWidth + (event.clientX - skyResizeDragState.startX),
                height: skyResizeDragState.startHeight + (event.clientY - skyResizeDragState.startY)
            }, metrics.bounds);

            updateSkyObserverLayout();
            syncVirtualSkySize(true);
            renderSkyStarOverlay();
        });

        const stopResize = () => {
            if (!skyResizeDragState) return;
            skyResizeDragState = null;
            document.body.style.userSelect = '';
        };

        window.addEventListener('pointerup', stopResize);
        window.addEventListener('pointercancel', stopResize);
    }

    window.addEventListener('resize', () => {
        if (skyResizeTimer) {
            clearTimeout(skyResizeTimer);
        }

        skyResizeTimer = setTimeout(() => {
            skyResizeTimer = null;
            scheduleSkyObserverLayout();
            syncVirtualSkySize(true);
            scheduleSkyOverlayRender();
        }, 120);
    });

    const overlay = document.getElementById('sky-star-overlay');
    if (overlay) {
        overlay.addEventListener('click', (event) => {
            if (event.target === overlay && skyState.lockedStar) {
                clearHighlight();
            }
        });
    }

    const panelBody = document.querySelector('.sky-panel-body');
    if (panelBody) {
        panelBody.addEventListener('mouseleave', () => {
            if (!skyState.lockedStar && skyState.hoveredStar) {
                setSkyHover(null);
            }
        });
    }

    refreshSkyStatus();
    syncSkyFusionModeUI();
    updateSkySizeSlider();
    updateAnalysisFilterButtons();
    updateAnalysisStats();

    console.log('UI 事件已绑定');
}

// 搜索框功能
function setupSearchBox() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length === 0) {
            searchResults.classList.remove('active');
            return;
        }
        
        const starsData = getSourceData('stars');
        const statesData = getSourceData('states');
        const results = [];
        
        if (starsData?.features) {
            starsData.features.forEach(f => {
                if (f.properties['星宿名'].toLowerCase().includes(query)) {
                    results.push({
                        type: 'star',
                        name: f.properties['星宿名'],
                        symbol: f.properties['四象'],
                        coords: f.geometry.coordinates
                    });
                }
            });
        }
        
        if (statesData?.features) {
            statesData.features.forEach(f => {
                if (f.properties['州郡名'].toLowerCase().includes(query)) {
                    results.push({
                        type: 'state',
                        name: f.properties['州郡名'],
                        coords: f.geometry.coordinates
                    });
                }
            });
        }
        
        displaySearchResults(results);
    });
    
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-item">无搜索结果</div>';
        searchResults.classList.add('active');
        return;
    }
    
    searchResults.innerHTML = results.map(r => {
        const tag = r.type === 'star' ? `<span class="tag">${r.symbol}</span>` : '<span class="tag">州郡</span>';
        return `<div class="search-item" onclick="searchItemClick('${r.type}', '${r.name}')">${r.name}${tag}</div>`;
    }).join('');
    searchResults.classList.add('active');
}

function searchItemClick(type, name) {
    if (type === 'star') {
        const starsData = getSourceData('stars');
        const feature = starsData.features.find(f => f.properties['星宿名'] === name);
        if (feature) {
            handleStarClick({ features: [feature] });
        }
    } else {
        const statesData = getSourceData('states');
        const feature = statesData.features.find(f => f.properties['州郡名'] === name);
        if (feature) {
            handleStateClick({ features: [feature] });
        }
    }
    document.getElementById('search-results').classList.remove('active');
}

function setupCoordDisplay() {
    if (!map) return;
    
    map.on('mousemove', (e) => {
        const coordText = document.getElementById('coord-text');
        if (coordText) {
            coordText.textContent = t('coordCurrent', {
                lng: e.lngLat.lng.toFixed(2),
                lat: e.lngLat.lat.toFixed(2)
            });
        }
    });
}

function setupInfoPanel() {
    const closeBtn = document.getElementById('close-panel');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearHighlight();
        });
    }
}

function rerenderCurrentHighlight() {
    if (!map || !currentHighlight) {
        setInfoPanelPlaceholder();
        return;
    }

    if (currentHighlight.type === 'star') {
        const feature = getSourceFeatures('stars').find((item) => normalizeStarName(item.properties['星宿名']) === normalizeStarName(currentHighlight.starName));
        if (feature) showStarPopup(feature.geometry.coordinates.slice(), feature.properties);
        return;
    }

    if (currentHighlight.type === 'state') {
        const feature = getSourceFeatures('states').find((item) => normalizeStateName(item.properties['州郡名']) === normalizeStateName(currentHighlight.stateName));
        if (feature) showStatePopup(feature.geometry.coordinates.slice(), feature.properties);
        return;
    }

    if (currentHighlight.type === 'line') {
        const feature = getSourceFeatures('fenye-lines').find((item) => normalizeStarName(item.properties['星宿']) === normalizeStarName(currentHighlight.starName) && normalizeStateName(item.properties['州郡']) === normalizeStateName(currentHighlight.stateName));
        if (feature) showLinePopup(getFeatureCoordinates(feature), feature.properties);
        return;
    }

    if (currentHighlight.type === 'compare-line') {
        const feature = getSourceFeatures('comparison-lines').find((item) => normalizeStarName(item.properties['星宿']) === normalizeStarName(currentHighlight.starName) && normalizeStateName(item.properties['州郡']) === normalizeStateName(currentHighlight.stateName));
        if (feature) showLinePopup(getFeatureCoordinates(feature), feature.properties);
    }
}

function applyLanguage(language) {
    currentLanguage = language === 'en' ? 'en' : 'zh';

    try {
        localStorage.setItem(I18N.storageKey, currentLanguage);
    } catch (error) {
        console.warn('保存语言设置失败:', error);
    }

    applyStaticTranslations();
    localizeMapDataLabels();

    if (map?.getSource('stars') && starsGeoJson) {
        map.getSource('stars').setData(starsGeoJson);
    }

    if (map?.getSource('states') && statesGeoJson) {
        map.getSource('states').setData(statesGeoJson);
    }

    updateAnalysisStats();
    refreshSkyStatus();

    if (map && dataLoaded) {
        syncAnalysisFilters();
        renderSkyStarOverlay();
        rerenderCurrentHighlight();
    } else {
        setInfoPanelPlaceholder();
    }
}

function showInfoPanel(title, content) {
    const panel = document.querySelector('.info-panel');
    document.getElementById('panel-title').textContent = title;
    document.getElementById('panel-content').innerHTML = content;
    panel.classList.add('active');
    setDetailFocusMode(true);
}

function showStarPopup(coordinates, properties) {
    const analysisNote = currentLanguage === 'en'
        ? `${getAlignmentMeta(properties['对应分级']).description} This case is classified as “${getDisplayRelationType(properties['关系类型'])}”.`
        : `${getAlignmentMeta(properties['对应分级']).description} 当前样本被归为“${properties['关系类型']}”。`;
    const html = `
        <div class="popup-content">
            <h3>${getDisplayStarLabel(properties['星宿名'])}</h3>
            <p><span class="label">${t('popupSymbol')}</span>${getDisplaySymbolLabel(properties['四象'])}</p>
            <p><span class="label">${t('popupAngularWidth')}</span>${properties['距度']}°</p>
            <p><span class="label">${t('popupCumulativeRa')}</span>${properties['累积赤经']}°</p>
            <p><span class="label">${t('popupFenye')}</span>${getDisplayStateLabel(properties['分野州郡'])}</p>
            ${renderEvidenceBlock(properties, analysisNote)}
        </div>
    `;

    document.querySelectorAll('.maplibregl-popup').forEach(p => p.remove());

    new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        anchor: 'bottom'
    })
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
    
    const panelContent = `
        <div class="panel-item">
            <strong>${t('panelStarName')}</strong>
            <div class="panel-item-value">${getDisplayStarLabel(properties['星宿名'])}</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelSymbol')}</strong>
            <div class="panel-item-value">${getDisplaySymbolLabel(properties['四象'])}</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelAngularWidth')}</strong>
            <div class="panel-item-value">${properties['距度']}°</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelCumulativeRa')}</strong>
            <div class="panel-item-value">${properties['累积赤经']}°</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelMappedState')}</strong>
            <div class="panel-item-value">${getDisplayStateLabel(properties['分野州郡'])}</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelAzimuth')}</strong>
            <div class="panel-item-value">${properties['方位角'].toFixed(2)}°</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelAnalysis')}</strong>
            <div class="panel-item-value">
                ${renderAnalysisBadge(properties['对应分级'], getAlignmentMeta(properties['对应分级']).label)}
                <ul class="analysis-list">
                    <li>${t('metricStateAzimuth')}: ${Number(properties['州郡方位']).toFixed(2)}°</li>
                    <li>${t('metricAngleDelta')}: ${Number(properties['角度差']).toFixed(2)}°</li>
                    <li>${t('metricRelationType')}: ${getDisplayRelationType(properties['关系类型'])}</li>
                    <li>${t('linkedMansionsSameRegion')}: ${translateListItems(properties['关联星宿'], getDisplayStarLabel)}</li>
                </ul>
                <div class="analysis-note">${analysisNote}</div>
            </div>
        </div>
        <div class="panel-item">
            <strong>${t('panelSource')}</strong>
            <div class="panel-item-value">${currentLanguage === 'en' ? 'Compiled from the Shiji and compared directionally with Chang\'an as the center.' : properties['文本依据']}</div>
        </div>
    `;
    
    showInfoPanel(getDisplayStarLabel(properties['星宿名']), panelContent);
}

function showStatePopup(coordinates, properties) {
    const mappedStars = translateListItems(properties['关联星宿列表'] || properties['分野星宿'], getDisplayStarLabel);
    const stateAnalysisNote = currentLanguage === 'en'
        ? `${getAlignmentMeta(properties['对应分级']).description} ${t('noteAverageDelta')}`
        : `${getAlignmentMeta(properties['对应分级']).description} 平均角度差用于概括该州郡与相关星宿之间的整体方向关系。`;
    const html = `
        <div class="popup-content">
            <h3>${getDisplayStateLabel(properties['州郡名'])}</h3>
            <p><span class="label">${t('popupMappedStar')}</span>${mappedStars}</p>
            <p><span class="label">${t('popupCenterCoords')}</span>(${properties['中心经度'].toFixed(1)}, ${properties['中心纬度'].toFixed(1)})</p>
            ${renderAnalysisBadge(properties['对应分级'], getAlignmentMeta(properties['对应分级']).label)}
            ${renderAnalysisMetrics([
                { label: t('metricStateAzimuth'), value: `${Number(properties['州郡方位']).toFixed(2)}°` },
                { label: t('metricAverageDelta'), value: `${Number(properties['平均角度差']).toFixed(2)}°` },
                { label: t('metricMaxDelta'), value: `${Number(properties['最大角度差']).toFixed(2)}°` },
                { label: t('metricRelationType'), value: getDisplayRelationType(properties['关系类型']) }
            ])}
        </div>
    `;

    document.querySelectorAll('.maplibregl-popup').forEach(p => p.remove());

    new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        anchor: 'bottom'
    })
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);
    
    const panelContent = `
        <div class="panel-item">
            <strong>${t('panelStateName')}</strong>
            <div class="panel-item-value">${getDisplayStateLabel(properties['州郡名'])}</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelMappedStar')}</strong>
            <div class="panel-item-value">${mappedStars}</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelCoordinates')}</strong>
            <div class="panel-item-value">${properties['中心经度'].toFixed(1)}° E, ${properties['中心纬度'].toFixed(1)}° N</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelHistoricalRole')}</strong>
            <div class="panel-item-value">${t('panelHistoricalRoleValue')}</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelAnalysis')}</strong>
            <div class="panel-item-value">
                ${renderAnalysisBadge(properties['对应分级'], getAlignmentMeta(properties['对应分级']).label)}
                <ul class="analysis-list">
                    <li>${t('metricStateAzimuth')}: ${Number(properties['州郡方位']).toFixed(2)}°</li>
                    <li>${t('metricAverageDelta')}: ${Number(properties['平均角度差']).toFixed(2)}°</li>
                    <li>${t('metricMaxDelta')}: ${Number(properties['最大角度差']).toFixed(2)}°</li>
                    <li>${t('metricRelationType')}: ${getDisplayRelationType(properties['关系类型'])}</li>
                    <li>${t('linkedMansions')}: ${translateListItems(properties['关联星宿列表'], getDisplayStarLabel)}</li>
                </ul>
                <div class="analysis-note">${stateAnalysisNote}</div>
            </div>
        </div>
        <div class="panel-item">
            <strong>${t('panelSource')}</strong>
            <div class="panel-item-value">${currentLanguage === 'en' ? 'Compiled from the Shiji and compared directionally with Chang\'an as the center.' : properties['文本依据']}</div>
        </div>
    `;
    
    showInfoPanel(getDisplayStateLabel(properties['州郡名']), panelContent);
}

function showLinePopup(coordinates, properties) {
    const isCompareLine = properties['文献版本'] && properties['文献版本'] !== '《史记·天官书》';
    const compareChanged = isCompareLine && normalizeStateName(properties['原始州郡']) !== normalizeStateName(properties['州郡']);
    const compareSummary = isCompareLine
        ? (compareChanged
            ? (currentLanguage === 'en'
                ? `${getDisplayStarLabel(properties['星宿'])} is reassigned from ${getDisplayStateLabel(properties['原始州郡'])} to ${getDisplayStateLabel(properties['州郡'])} in the Hanshu tradition.`
                : `${getDisplayStarLabel(properties['星宿'])} 在《汉书》中由 ${getDisplayStateLabel(properties['原始州郡'])} 改配为 ${getDisplayStateLabel(properties['州郡'])}。`)
            : (currentLanguage === 'en'
                ? `${getDisplayStarLabel(properties['星宿'])} keeps the same regional assignment in both the Shiji and the Hanshu.`
                : `${getDisplayStarLabel(properties['星宿'])} 在《史记》与《汉书》中保持同一州郡对应。`))
        : '';
    const analysisNote = currentLanguage === 'en'
        ? isCompareLine
            ? `${getAlignmentMeta(properties['对应分级']).description} ${compareSummary}`
            : `${getAlignmentMeta(properties['对应分级']).description} ${t('noteLineAnalysis')}`
        : isCompareLine
            ? `${getAlignmentMeta(properties['对应分级']).description} ${compareSummary}`
            : `${getAlignmentMeta(properties['对应分级']).description} 该连线直接展示星宿方位与州郡方位之间的差值。`;
    const html = `
        <div class="popup-content">
            <h3>${getDisplayStarLabel(properties['星宿'])} → ${getDisplayStateLabel(properties['州郡'])}</h3>
            <p><span class="label">${t('popupSymbol')}</span>${getDisplaySymbolLabel(properties['四象'])}</p>
            <p><span class="label">${t('popupVersion')}</span>${getDisplaySourceVersion(properties['文献版本'] || '《史记·天官书》')}</p>
            <p><span class="label">${t('popupRelationType')}</span>${getDisplayRelationType(properties['关系类型'])}</p>
            ${renderEvidenceBlock(properties, analysisNote)}
        </div>
    `;

    document.querySelectorAll('.maplibregl-popup').forEach(p => p.remove());

    new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        anchor: 'bottom'
    })
        .setLngLat(coordinates)
        .setHTML(html)
        .addTo(map);

    const panelContent = `
        <div class="panel-item">
            <strong>${t('panelRelation')}</strong>
            <div class="panel-item-value">${getDisplayStarLabel(properties['星宿'])} → ${getDisplayStateLabel(properties['州郡'])}</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelVersion')}</strong>
            <div class="panel-item-value">${getDisplaySourceVersion(properties['文献版本'] || '《史记·天官书》')}</div>
        </div>
        <div class="panel-item">
            <strong>${t('panelEvidence')}</strong>
            <div class="panel-item-value">
                ${renderAnalysisBadge(properties['对应分级'], getAlignmentMeta(properties['对应分级']).label)}
                <ul class="analysis-list">
                    <li>${t('metricStarAzimuth')}: ${Number(properties['星宿方位']).toFixed(2)}°</li>
                    <li>${t('metricStateAzimuth')}: ${Number(properties['州郡方位']).toFixed(2)}°</li>
                    <li>${t('metricAngleDelta')}: ${Number(properties['角度差']).toFixed(2)}°</li>
                    <li>${t('metricRelationType')}: ${getDisplayRelationType(properties['关系类型'])}</li>
                    <li>${t('linkedMansionsSameRegion')}: ${translateListItems(properties['关联星宿'], getDisplayStarLabel)}</li>
                    ${isCompareLine ? `<li>${t('panelShijiState')} ${getDisplayStateLabel(properties['原始州郡'])}</li>` : ''}
                    ${isCompareLine ? `<li>${t('panelHanshuState')} ${getDisplayStateLabel(properties['州郡'])}</li>` : ''}
                    ${isCompareLine ? `<li>${t('panelChangeStatus')} ${compareChanged ? t('compareChanged') : t('compareUnchanged')}</li>` : ''}
                </ul>
                ${isCompareLine ? `<div class="analysis-note"><strong>${t('panelChangeSummary')}</strong> ${compareSummary}</div>` : ''}
                <div class="analysis-note">${analysisNote}</div>
            </div>
        </div>
        <div class="panel-item">
            <strong>${t('panelSource')}</strong>
            <div class="panel-item-value">${currentLanguage === 'en' ? getDisplaySourceVersion(properties['文献版本'] || '《史记·天官书》') : properties['文本依据']}</div>
        </div>
    `;

    showInfoPanel(`${getDisplayStarLabel(properties['星宿'])} → ${getDisplayStateLabel(properties['州郡'])}`, panelContent);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('应用启动...');
    initializeChapterHtmlCache();
    currentLanguage = getInitialLanguage();
    applyStaticTranslations();
    initMap();
    setupUIEvents();
    
    // 在地图加载完成后设置搜索和坐标显示
    setTimeout(() => {
        setupSearchBox();
        setupCoordDisplay();
        setupInfoPanel();
        const coordText = document.getElementById('coord-text');
        if (coordText && !coordText.textContent.trim()) {
            coordText.textContent = t('coordInitial');
        }
    }, 2000);
});

console.log('汉代分野地图系统加载');
