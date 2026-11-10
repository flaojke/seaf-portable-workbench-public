const SCHEMAS = {
    DC_REGION: 'seaf.company.ta.services.dc_regions',
    DC_AZ: 'seaf.company.ta.services.dc_azs',
    DC: 'seaf.company.ta.services.dcs',
    DC_OFFICE: 'seaf.company.ta.services.dc_offices',
    NETWORK_SEGMENT: 'seaf.company.ta.services.network_segments',
    NETWORK: 'seaf.company.ta.services.networks',
    NETWORK_LINK: 'seaf.company.ta.services.network_links',
    LOGICAL_LINK: 'seaf.company.ta.services.logical_links',
    NETWORK_SERVICE: 'seaf.company.ta.services.network_services',
    COMPONENT_NETWORK: 'seaf.company.ta.components.networks',
    COMPONENT_SERVER: 'seaf.company.ta.components.servers',
    COMPONENT_USER_DEVICE: 'seaf.company.ta.components.user_devices',
    COMPUTE_SERVICE: 'seaf.company.ta.services.compute_services',
    CLUSTER_VIRTUALIZATION: 'seaf.company.ta.services.cluster_virtualizations',
    K8S: 'seaf.company.ta.services.k8s',
    BACKUP: 'seaf.company.ta.services.backups',
    MONITORING: 'seaf.company.ta.services.monitorings',
    STORAGE: 'seaf.company.ta.services.storages',
    HW_STORAGE: 'seaf.company.ta.services.hw_storages',
    KB: 'seaf.company.ta.services.kbs'
};

const LEGACY_TO_SEAF2 = {
    'seaf.ta.services.dc_region': SCHEMAS.DC_REGION,
    'seaf.ta.services.dc_az': SCHEMAS.DC_AZ,
    'seaf.ta.services.dc': SCHEMAS.DC,
    'seaf.ta.services.office': SCHEMAS.DC_OFFICE,
    'seaf.ta.services.network_segment': SCHEMAS.NETWORK_SEGMENT,
    'seaf.ta.services.network': SCHEMAS.NETWORK,
    'seaf.ta.services.network_link': SCHEMAS.NETWORK_LINK,
    'seaf.ta.services.network_links': SCHEMAS.NETWORK_LINK,
    'seaf.ta.services.logical_link': SCHEMAS.LOGICAL_LINK,
    'seaf.ta.services.logical_links': SCHEMAS.LOGICAL_LINK,
    'seaf.ta.components.network': SCHEMAS.COMPONENT_NETWORK,
    'seaf.ta.components.networks': SCHEMAS.COMPONENT_NETWORK,
    'seaf.ta.components.server': SCHEMAS.COMPONENT_SERVER,
    'seaf.ta.components.servers': SCHEMAS.COMPONENT_SERVER,
    'seaf.ta.components.user_device': SCHEMAS.COMPONENT_USER_DEVICE,
    'seaf.ta.components.user_devices': SCHEMAS.COMPONENT_USER_DEVICE,
    'seaf.ta.services.compute_service': SCHEMAS.COMPUTE_SERVICE,
    'seaf.ta.services.compute_services': SCHEMAS.COMPUTE_SERVICE,
    'seaf.ta.services.cluster': SCHEMAS.COMPUTE_SERVICE,
    'seaf.ta.services.cluster_virtualization': SCHEMAS.CLUSTER_VIRTUALIZATION,
    'seaf.ta.services.cluster_virtualizations': SCHEMAS.CLUSTER_VIRTUALIZATION,
    'seaf.ta.services.k8s': SCHEMAS.K8S,
    'seaf.ta.services.backup': SCHEMAS.BACKUP,
    'seaf.ta.services.backups': SCHEMAS.BACKUP,
    'seaf.ta.services.monitoring': SCHEMAS.MONITORING,
    'seaf.ta.services.monitorings': SCHEMAS.MONITORING,
    'seaf.ta.services.storage': SCHEMAS.STORAGE,
    'seaf.ta.services.storages': SCHEMAS.STORAGE,
    'seaf.ta.services.hw_storage': SCHEMAS.HW_STORAGE,
    'seaf.ta.services.hw_storages': SCHEMAS.HW_STORAGE,
    'seaf.ta.services.kb': SCHEMAS.KB,
    'seaf.ta.services.kbs': SCHEMAS.KB
};

const SEAF2_TO_LEGACY = Object.entries(LEGACY_TO_SEAF2).reduce((acc, [legacy, schema]) => {
    acc[schema] = acc[schema] ?? [];
    acc[schema].push(legacy);
    return acc;
}, {});

const DRAWIO_XML_START = '<mxfile host="Electron" agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) draw.io/26.0.9 Chrome/128.0.6613.186 Electron/32.2.5 Safari/537.36" version="26.0.9">';
const DRAWIO_XML_END = '</mxfile>';

const MAIN_SCHEMA_XML = `<diagram id="RXcWit5hHr6IPpoLcjqJ" name="Main Schema">
    <mxGraphModel dx="1114" dy="820" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="003" value="INTERNET" parent="0" />
        <mxCell id="INTERNET" value="Internet" style="rounded=1;whiteSpace=wrap;html=1;verticalAlign=top;align=center;spacingTop=8;fillColor=#FFF7ED;strokeColor=#FDBA74;strokeWidth=1;fontColor=#334155;fontStyle=1;fontSize=11;" parent="003" vertex="1">
          <mxGeometry x="10" y="60" width="170" height="590" as="geometry" />
        </mxCell>
        <mxCell id="004" value="WAN" parent="0" />
        <mxCell id="TRANSPORT-WAN" value="Транспортная сеть" style="rounded=1;whiteSpace=wrap;html=1;verticalAlign=top;align=center;spacingTop=8;fillColor=#FFFBEB;strokeColor=#FCD34D;strokeWidth=1;fontColor=#334155;fontStyle=1;fontSize=11;" parent="004" vertex="1">
          <mxGeometry x="200" y="60" width="170" height="590" as="geometry" />
        </mxCell>
        <mxCell id="100" value="Connections" parent="0" />
        </root>
    </mxGraphModel>
  </diagram>`;

const NETWORK_LINK_XML = `<object id="{id}" label="{label}">
    <mxCell style="{style}" edge="1" parent="100" source="{source_id}" target="{target_id}">
        <mxGeometry relative="1" as="geometry"/>
    </mxCell>
</object>`;

const SEGMENT_PADDING_X = 20;

const LAYOUT_TARGET_SCHEMAS = {
    [SCHEMAS.COMPUTE_SERVICE]: {
        'group_by': ['service_type'],
        'group_name': 'Прочие сервисы',
        'auto_segment': true
    },
    [SCHEMAS.CLUSTER_VIRTUALIZATION]: {
        'group_name': 'Платформы виртуализации',
        'auto_segment': true
    },
    [SCHEMAS.K8S]: {
        'group_name': 'Контейнерные платформы',
        'auto_segment': true
    },
    [SCHEMAS.MONITORING]: {
        'group_name': 'Мониторинг',
        'auto_segment': true
    },
    [SCHEMAS.BACKUP]: {
        'group_name': 'Резервное копирование',
        'auto_segment': true
    },
    [SCHEMAS.KB]: {
        'group_by': ['technology', 'tag'],
        'group_name': 'Средства кибербезопасности',
        'auto_segment': true
    }
};

const LAYOUT_ZONE_RULES = {
    'INET-EDGE': {
        'layout_mode': 'stack_down',
        'neighbors_right_zones': ['DMZ']
    },
    'INT-NET': {
        'layout_mode': 'append_right',
        'tech_top': SEGMENT_PADDING_X,
        'append_width': 1400,
        'neighbors_right_zones': ['INT-SECURITY-NET']
    },
    'DMZ': {
        'layout_mode': 'append_right',
        'tech_top': SEGMENT_PADDING_X,
        'append_width': 400,
        'stack_below_zones': ['INT-WAN-EDGE'],
        'neighbors_right_zones': ['INT-NET']
    },
    'INT-SECURITY-NET': {
        'layout_mode': 'append_right',
        'tech_top': SEGMENT_PADDING_X,
        'append_width': 800
    }
};

const LAYOUT_SECURITY_ZONE_HINTS = {
    'DMZ': [
        'waf',
        'web application firewall',
        'reverse proxy',
        'secure gateway'
    ],
    'INT-SECURITY-NET': [
        'ids',
        'ips',
        'siem',
        'antivirus',
        'dlp',
        'socc',
        'crypto',
        'крипто',
        'разгранич'
    ]
};

const LINK_ID_PREFIX = '21Sd8LG:link_id:';

const LAYOUT_NODE_DEFAULT_WIDTH = 40;
const LAYOUT_NODE_DEFAULT_HEIGHT = 40;

export {
  DRAWIO_XML_START,
  DRAWIO_XML_END,
  MAIN_SCHEMA_XML,
  LAYOUT_TARGET_SCHEMAS,
  LAYOUT_ZONE_RULES,
  LAYOUT_SECURITY_ZONE_HINTS,
  LAYOUT_NODE_DEFAULT_HEIGHT,
  LAYOUT_NODE_DEFAULT_WIDTH,
  LINK_ID_PREFIX,
  SCHEMAS,
  LEGACY_TO_SEAF2,
  SEAF2_TO_LEGACY,
  NETWORK_LINK_XML
};
