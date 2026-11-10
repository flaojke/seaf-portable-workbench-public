/**
 * @jest-environment jsdom
 */

import { describe, expect, it, jest } from '@jest/globals';
import {
  AI_PROMPT_SCHEMA_CATALOG,
  assertGenerationCurrent,
  compactValidationReport,
  generateValidatedDraft,
  isAiExportBlocked,
  normalizeAiPrompt,
  prepareAiContextDataset,
  resolveAiDraftConfig,
  validateDatasetStructure,
  validateDrawnCoverage
} from '../../plugins/seaf2drawiojs/lib/ai-draft';
import dcPatterns from '../../plugins/seaf2drawiojs/patterns/dc.json';
import mainPatterns from '../../plugins/seaf2drawiojs/patterns/main.json';
import officePatterns from '../../plugins/seaf2drawiojs/patterns/office.json';

const validDataset = {
  'seaf.company.ta.services.dc_regions': {
    'region.main': { title: 'Main region' }
  },
  'seaf.company.ta.services.dc_offices': {
    'office.main': { title: 'Office', region: 'region.main' }
  },
  'seaf.company.ta.services.dc_azs': {
    'az.main': { title: 'AZ', vendor: 'Internal', region: 'region.main' }
  },
  'seaf.company.ta.services.dcs': {
    'dc.main': { title: 'DC', vendor: 'Internal', availabilityzone: 'az.main' }
  },
  'seaf.company.ta.services.network_segments': {
    'segment.main': { title: 'Segment', location: 'dc.main', zone: 'INT-NET' }
  },
  'seaf.company.ta.services.networks': {
    'network.main': {
      title: 'LAN',
      type: 'LAN',
      location: ['dc.main'],
      lan_type: 'Проводная',
      ipnetwork: '10.0.0.0/24',
      segment: ['segment.main']
    }
  },
  'seaf.company.ta.services.monitorings': {
    'monitoring.main': {
      title: 'Monitoring',
      role: ['Инфраструктурный'],
      ha: true,
      location: ['dc.main'],
      network_connection: ['network.main'],
      monitored_services: ['kb.main']
    }
  },
  'seaf.company.ta.services.softwares': {
    'jupiter.software.siem': {
      title: 'SIEM',
      vendor: 'Vendor',
      type: 'Закрытая платная',
      support: 'Да',
      expiration: '2030-01-01'
    }
  },
  'seaf.company.ta.services.kbs': {
    'kb.main': {
      title: 'SIEM',
      technology: 'Аудит событий КБ',
      softwares: ['jupiter.software.siem'],
      tag: 'Log',
      status: 'Используется',
      network_connection: ['network.main']
    }
  },
  'seaf.company.ta.components.hw_storages': {
    'hw.storage.main': {
      title: 'Hardware storage',
      vendor: 'Vendor',
      volume: 100,
      location: ['dc.main']
    }
  },
  'seaf.company.ta.services.logical_links': {
    'link.main': { title: 'Monitoring link', source: 'monitoring.main', target: ['kb.main'], direction: '==>' }
  }
};

function logicalSelectionDataset(linkData) {
  return {
    'seaf.company.ta.services.compute_services': {
      'service.a': { title: 'Alpha' },
      'service.b': { title: 'Beta' },
      'service.c': { title: 'Gamma' }
    },
    'seaf.company.ta.services.logical_links': {
      'link.test': { title: 'Test link', ...linkData }
    }
  };
}

const selectionMatrixDataset = {
  ...structuredClone(validDataset),
  'seaf.company.ta.services.networks': {
    ...structuredClone(validDataset['seaf.company.ta.services.networks']),
    'network.external': {
      ...structuredClone(validDataset['seaf.company.ta.services.networks']['network.main']),
      title: 'External WAN',
      type: 'WAN',
      provider: 'ISP',
      wan_ip: '192.0.2.0/24',
      segment: []
    },
    'network.edge': {
      ...structuredClone(validDataset['seaf.company.ta.services.networks']['network.main']),
      title: 'Internet edge',
      segment: ['segment.external']
    }
  },
  'seaf.company.ta.services.network_segments': {
    ...structuredClone(validDataset['seaf.company.ta.services.network_segments']),
    'segment.external': { title: 'Internet', location: 'dc.main', zone: 'INTERNET' }
  },
  'seaf.company.ta.components.networks': {
    'network-device.main': {
      title: 'Router',
      type: 'Маршрутизатор (роутер)',
      location: ['dc.main'],
      segment: 'segment.main',
      network_connection: ['network.main', 'network.external', 'network.edge'],
      network_connection_devices: ['network-device.peer', 'network-link.external']
    },
    'network-device.peer': {
      title: 'External firewall',
      type: 'Межсетевой экран (файрвол)',
      location: ['dc.main'],
      segment: 'segment.external',
      network_connection_devices: ['network-device.main']
    }
  },
  'seaf.company.ta.services.network_links': {
    'network-link.external': {
      title: 'ISP uplink',
      network_connection: ['network.external', 'network.edge']
    }
  },
  'seaf.company.ta.services.k8s': {
    'k8s.main': {
      title: 'Kubernetes cluster',
      availabilityzone: ['az.main'],
      location: ['dc.main'],
      network_connection: ['network.main']
    }
  },
  'seaf.company.ta.services.backups': {
    'backup.main': {
      title: 'Backup',
      path: '/backup',
      backed_up_services: [],
      availabilityzone: ['az.main'],
      location: ['dc.main'],
      network_connection: ['network.main']
    }
  }
};

const humanLanguageDataset = {
  ...structuredClone(selectionMatrixDataset),
  'seaf.company.ta.services.monitorings': {
    'monitoring.elk': {
      ...structuredClone(validDataset['seaf.company.ta.services.monitorings']['monitoring.main']),
      title: 'ELK',
      monitored_services: ['monitoring.zabbix', 'kb.main']
    },
    'monitoring.zabbix': {
      ...structuredClone(validDataset['seaf.company.ta.services.monitorings']['monitoring.main']),
      title: 'Zabbix',
      monitored_services: ['monitoring.elk']
    }
  },
  'seaf.company.ta.services.kbs': {
    'kb.main': {
      ...structuredClone(validDataset['seaf.company.ta.services.kbs']['kb.main']),
      title: 'SIEM/Logs'
    }
  },
  'seaf.company.ta.services.logical_links': {
    'link.elk-siem': {
      title: 'ELK to SIEM', source: 'monitoring.elk', target: ['kb.main'], direction: '==>'
    },
    'link.elk-zabbix': {
      title: 'ELK to Zabbix', source: 'monitoring.elk', target: ['monitoring.zabbix'], direction: '==>'
    },
    'link.backup-elk': {
      title: 'Backup to ELK', source: 'backup.main', target: ['monitoring.elk'], direction: '==>'
    },
    'link.k8s-zabbix': {
      title: 'Kubernetes to Zabbix', source: 'k8s.main', target: ['monitoring.zabbix'], direction: '==>'
    }
  }
};

const HUMAN_OBJECT_OIDS = ['backup.main', 'k8s.main', 'kb.main', 'monitoring.elk', 'monitoring.zabbix'];
const HUMAN_LINK_OIDS = ['link.backup-elk', 'link.elk-siem', 'link.elk-zabbix', 'link.k8s-zabbix'];

function humanSelectionSnapshot(dataset) {
  const selected = new Set(Object.values(dataset || {}).flatMap((entities) => Object.keys(entities || {})));
  return {
    objects: HUMAN_OBJECT_OIDS.filter((oid) => selected.has(oid)),
    links: HUMAN_LINK_OIDS.filter((oid) => selected.has(oid))
  };
}

describe('SEAF2DrawIO AI draft', () => {
  it('renders a monitoring and KB selection with newer Jupiter KB technologies', async() => {
    const kbSchema = 'seaf.company.ta.services.kbs';
    const dataset = structuredClone(validDataset);
    Object.assign(dataset[kbSchema], {
      'jupiter.kb.idm.corp': {
        title: 'Corporate IdM',
        technology: 'Управление учетными записями (IdM)',
        tag: 'IdM',
        status: 'Используется',
        network_connection: ['network.main'],
        softwares: ['jupiter.software.siem']
      },
      'jupiter.kb.registry.harbor': {
        title: 'Harbor Registry',
        technology: 'Реестр контейнеров',
        tag: 'Registry',
        status: 'Используется',
        network_connection: ['network.main'],
        softwares: ['jupiter.software.siem']
      },
      'jupiter.kb.policy.kyverno': {
        title: 'Kyverno Policy',
        technology: 'Политики Kubernetes',
        tag: 'Policy',
        status: 'Используется',
        network_connection: ['network.main'],
        softwares: ['jupiter.software.siem']
      }
    });
    const prompt = 'Покажи мониторинг и средства КБ';
    const currentDataset = prepareAiContextDataset(dataset, { contextMode: 'compact' }, prompt);
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    global.DocHub = { documents: { getLoggerWithTag: jest.fn(() => logger) } };
    const { renderSeafDiagram } = await import('../../plugins/seaf2drawiojs/lib/renderer');
    const legacyResult = renderSeafDiagram({ dataset: currentDataset, logger });
    const result = renderSeafDiagram({ dataset: currentDataset, logger, useAiKbFallback: true });
    const coverage = validateDrawnCoverage(currentDataset, result.report);
    const generated = await generateValidatedDraft({
      prompt,
      currentDataset,
      maxAttempts: 1,
      send: jest.fn().mockResolvedValue(JSON.stringify({ selected_oids: ['monitoring.main'] })),
      validate: (selectedDataset) => {
        const rendered = renderSeafDiagram({ dataset: selectedDataset, logger, useAiKbFallback: true });
        const selectedCoverage = validateDrawnCoverage(selectedDataset, rendered.report);
        return {
          ...rendered.report,
          valid: rendered.report.allMatch === true && selectedCoverage.valid,
          diagnostics: selectedCoverage.diagnostics
        };
      }
    });

    expect(result.report.allMatch).toBe(true);
    expect(coverage.valid).toBe(true);
    expect(generated.valid).toBe(true);
    expect(legacyResult.report.drawn[kbSchema] ?? []).not.toEqual(expect.arrayContaining([
      'jupiter.kb.idm.corp',
      'jupiter.kb.registry.harbor',
      'jupiter.kb.policy.kyverno'
    ]));
    expect(result.report.drawn[kbSchema]).toEqual(expect.arrayContaining([
      'jupiter.kb.idm.corp',
      'jupiter.kb.registry.harbor',
      'jupiter.kb.policy.kyverno'
    ]));
  });

  it('is disabled by default and clamps attempts to three', () => {
    expect(resolveAiDraftConfig({}, {}).enabled).toBe(false);
    expect(resolveAiDraftConfig({ ai_assistant: { enabled: true, max_attempts: 99 } }, {}).maxAttempts).toBe(3);
    expect(resolveAiDraftConfig({}, {}).contextMode).toBe('compact');
    expect(resolveAiDraftConfig({}, {}).responseMode).toBe('selection');
    expect(resolveAiDraftConfig({ ai_assistant: { context_mode: 'compact' } }, {}).contextMode).toBe('compact');
    expect(resolveAiDraftConfig({ ai_assistant: { response_mode: 'selection' } }, {}).responseMode).toBe('selection');
    expect(resolveAiDraftConfig(
      { ai_assistant: { enabled: false } },
      { ai_assistant: { enabled: true } }
    ).enabled).toBe(false);
    expect(resolveAiDraftConfig(
      { ai_assistant: { enabled: true } },
      { ai_assistant: { enabled: false } }
    ).enabled).toBe(true);
    expect(resolveAiDraftConfig(
      {},
      { ai_assistant: { enabled: true } }
    ).enabled).toBe(false);
    expect(resolveAiDraftConfig(
      { ai_assistant: { scenario: { history: false } } },
      {}
    ).scenario.history).toBe(false);
  });

  it('reports unknown AI modes instead of silently replacing them', () => {
    const config = resolveAiDraftConfig({
      ai_assistant: { context_mode: 'full', response_mode: 'stream' }
    }, {});

    expect(config.contextMode).toBe('full');
    expect(config.responseMode).toBe('stream');
    expect(config.diagnostics).toEqual([
      expect.objectContaining({ code: 'invalid_configuration', field: 'context_mode' }),
      expect.objectContaining({ code: 'invalid_configuration', field: 'response_mode' })
    ]);
    expect(resolveAiDraftConfig({ ai_assistant: { response_mode: 'dataset' } }, {}).diagnostics)
      .toEqual([expect.objectContaining({ code: 'invalid_configuration', field: 'response_mode' })]);
  });

  it('defaults validated generation to selection and rejects unknown modes before LLM call', async() => {
    const send = jest.fn().mockResolvedValue(JSON.stringify({ selected_oids: ['monitoring.main'] }));
    const validate = jest.fn().mockResolvedValue({ valid: true, diagnostics: [] });
    const selected = await generateValidatedDraft({
      prompt: 'Покажи monitoring.main',
      currentDataset: validDataset,
      send,
      validate
    });

    expect(selected.valid).toBe(true);
    expect(send.mock.calls[0][0]).toContain('selected_oids');

    const invalidSend = jest.fn();
    await expect(generateValidatedDraft({
      prompt: 'Покажи monitoring.main',
      currentDataset: validDataset,
      contextMode: 'full',
      responseMode: 'stream',
      send: invalidSend,
      validate
    })).rejects.toMatchObject({
      code: 'invalid_configuration',
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ field: 'context_mode' }),
        expect.objectContaining({ field: 'response_mode' })
      ])
    });
    expect(invalidSend).not.toHaveBeenCalled();

    await expect(generateValidatedDraft({
      prompt: 'Покажи monitoring.main',
      currentDataset: validDataset,
      responseMode: 'dataset',
      send: invalidSend,
      validate
    })).rejects.toMatchObject({
      code: 'invalid_configuration',
      diagnostics: [expect.objectContaining({ field: 'response_mode' })]
    });
  });

  it('blocks every export state while an AI dataset is active', () => {
    expect(isAiExportBlocked({ aiApplied: true })).toBe(true);
    expect(isAiExportBlocked({ aiBusy: true })).toBe(true);
    expect(isAiExportBlocked({ aiPreviewXml: '<mxfile />' })).toBe(true);
    expect(isAiExportBlocked()).toBe(false);
  });

  it('keeps repair history inside each fresh A→B→A chat session', () => {
    const config = resolveAiDraftConfig({ ai_assistant: { scenario: { history: true } } }, {});
    const firstA = normalizeAiPrompt('Покажи monitoring, Kubernetes и средства КБ');
    normalizeAiPrompt('Нарисуй monitoring и резервное копирование');
    const secondA = normalizeAiPrompt('Покажи monitoring, Kubernetes и средства КБ');

    expect(config.scenario.history).toBe(true);
    expect(secondA).toEqual(firstA);
  });

  it('builds an isolated compact context for large base diagrams', () => {
    const source = structuredClone(validDataset);
    source['seaf.company.ta.services.monitorings']['monitoring.main'] = {
      ...source['seaf.company.ta.services.monitorings']['monitoring.main'],
      OID: 'monitoring.main',
      schema: 'seaf.company.ta.services.monitorings',
      description: 'Long UI description',
      __domain__: 'jupiter',
      api_token: 'must-not-leak',
      nested: {
        title: 'Preserved nested value',
        private_key: 'must-not-leak'
      }
    };

    const compact = prepareAiContextDataset(source, { contextMode: 'compact' });
    const monitoring = compact['seaf.company.ta.services.monitorings']['monitoring.main'];

    expect(monitoring).toEqual(expect.objectContaining({
      title: 'Monitoring',
      role: ['Инфраструктурный'],
      network_connection: ['network.main'],
      nested: { title: 'Preserved nested value' }
    }));
    expect(monitoring).not.toHaveProperty('OID');
    expect(monitoring).not.toHaveProperty('schema');
    expect(monitoring).not.toHaveProperty('description');
    expect(monitoring).not.toHaveProperty('__domain__');
    expect(monitoring).not.toHaveProperty('api_token');
    expect(source['seaf.company.ta.services.monitorings']['monitoring.main']).toHaveProperty('api_token', 'must-not-leak');
  });

  it.each([
    'Оставь на схеме только сервисы мониторинга и средства КБ',
    'оставил только сервис мониторинга и средства ЭКБ',
    'Покажи monitoring и системы информационной безопасности',
    'оставь маниторинг и ИБ'
  ])('normalizes monitoring and KB wording into canonical SEAF schemas: %s', (prompt) => {
    const intent = normalizeAiPrompt(prompt);

    expect(intent.requestedSchemas).toEqual(expect.arrayContaining([
      'seaf.company.ta.services.monitorings',
      'seaf.company.ta.services.kbs'
    ]));
    expect(intent.canonicalPrompt).toContain('сервисы мониторинга [seaf.company.ta.services.monitorings]');
    expect(intent.canonicalPrompt).toContain('средства кибербезопасности (КБ) [seaf.company.ta.services.kbs]');
  });

  it.each([
    'Оставь на схеме только сервисы мониторинга и kubernetes',
    'Покажи monitoring и K8s',
    'Оставь только мониторинг и контейнерные кластеры'
  ])('normalizes monitoring and Kubernetes wording into canonical SEAF schemas: %s', (prompt) => {
    const intent = normalizeAiPrompt(prompt);

    expect(intent.requestedSchemas).toEqual(expect.arrayContaining([
      'seaf.company.ta.services.monitorings',
      'seaf.company.ta.services.k8s'
    ]));
    expect(intent.canonicalPrompt).toContain('Kubernetes-кластеры [seaf.company.ta.services.k8s]');
  });

  it.each([
    ['регионы', 'seaf.company.ta.services.dc_regions'],
    ['зоны доступности', 'seaf.company.ta.services.dc_azs'],
    ['центры обработки данных', 'seaf.company.ta.services.dcs'],
    ['офисы', 'seaf.company.ta.services.dc_offices'],
    ['сетевые сегменты', 'seaf.company.ta.services.network_segments'],
    ['сетевые сервисы', 'seaf.company.ta.services.network_services'],
    ['сети', 'seaf.company.ta.services.networks'],
    ['сетевые устройства', 'seaf.company.ta.components.networks'],
    ['пользовательские устройства', 'seaf.company.ta.components.user_devices'],
    ['вычислительные сервисы', 'seaf.company.ta.services.compute_services'],
    ['кластеры виртуализации', 'seaf.company.ta.services.cluster_virtualizations'],
    ['Kubernetes', 'seaf.company.ta.services.k8s'],
    ['резервное копирование', 'seaf.company.ta.services.backups'],
    ['бекап', 'seaf.company.ta.services.backups'],
    ['бэкап', 'seaf.company.ta.services.backups'],
    ['сервисы мониторинга', 'seaf.company.ta.services.monitorings'],
    ['средства КБ', 'seaf.company.ta.services.kbs'],
    ['логические связи', 'seaf.company.ta.services.logical_links']
  ])('recognizes renderer-supported category %s as %s', (phrase, schema) => {
    expect(normalizeAiPrompt(`Оставь только ${phrase}`).requestedSchemas).toContain(schema);
  });

  it('keeps network-service members and placement dependencies in compact context', () => {
    const serviceSchema = 'seaf.company.ta.services.network_services';
    const componentSchema = 'seaf.company.ta.components.networks';
    const networkSchema = 'seaf.company.ta.services.networks';
    const compact = prepareAiContextDataset({
      [serviceSchema]: { 'service.main': { title: 'Cluster', network_connection: ['network.main'] } },
      [componentSchema]: { 'device.main': { title: 'Node', is_part_of: 'service.main' } },
      [networkSchema]: { 'network.main': { title: 'LAN' } }
    }, { contextMode: 'compact' }, 'Покажи сетевые сервисы');

    expect(compact[serviceSchema]['service.main'].network_connection).toEqual(['network.main']);
    expect(compact[componentSchema]['device.main'].is_part_of).toBe('service.main');
    expect(compact[networkSchema]['network.main']).toBeDefined();
  });

  it('does not turn negated categories into selected schemas', () => {
    const intent = normalizeAiPrompt('Покажи средства КБ без мониторинга и без сетей');

    expect(intent.requestedSchemas).toEqual(['seaf.company.ta.services.kbs']);
  });

  it('treats incoming and outgoing together as an adjacent-link request', () => {
    const source = logicalSelectionDataset({
      source: 'service.a', target: ['service.b'], direction: '==>'
    });
    const prompt = 'Покажи входящие и исходящие связи service.a';

    const intent = normalizeAiPrompt(prompt);
    const compact = prepareAiContextDataset(source, { contextMode: 'compact' }, prompt);

    expect(intent.logicalLinkScope).toBe('adjacent');
    expect(intent.logicalLinkDirection).toBe('any');
    expect(compact['seaf.company.ta.services.logical_links']['link.test']).toBeDefined();
  });

  it('combines explicitly named OIDs and titles when selecting context', () => {
    const source = logicalSelectionDataset({
      source: 'service.a', target: ['service.b'], direction: '==>'
    });

    const compact = prepareAiContextDataset(
      source,
      { contextMode: 'compact' },
      'Покажи service.a и Beta'
    );

    expect(Object.keys(compact['seaf.company.ta.services.compute_services']).sort())
      .toEqual(['service.a', 'service.b']);
  });

  it('recognizes only valid data-center spellings', () => {
    expect(normalizeAiPrompt('Покажи дата-центр').requestedSchemas)
      .toContain('seaf.company.ta.services.dcs');
    expect(normalizeAiPrompt('Покажи датахцентр').requestedSchemas)
      .not.toContain('seaf.company.ta.services.dcs');
    expect(normalizeAiPrompt('Покажи dc regions').requestedSchemas)
      .not.toContain('seaf.company.ta.services.dcs');
  });

  it('does not add logical links when the user explicitly excludes them', () => {
    const intent = normalizeAiPrompt('Покажи мониторинг и средства КБ без связей');

    expect(intent.requestedSchemas).toEqual(expect.arrayContaining([
      'seaf.company.ta.services.monitorings',
      'seaf.company.ta.services.kbs'
    ]));
    expect(intent.logicalLinksRequested).toBe(false);
    expect(intent.logicalLinkScope).toBe('none');
  });

  it('adds only an existing logical link between selected objects by default', () => {
    const source = logicalSelectionDataset({
      source: 'service.a', target: ['service.b'], direction: '==>'
    });

    const compact = prepareAiContextDataset(
      source,
      { contextMode: 'compact' },
      'Покажи service.a и service.b'
    );

    expect(compact['seaf.company.ta.services.logical_links']['link.test']).toEqual(expect.objectContaining({
      source: 'service.a', target: ['service.b'], direction: '==>'
    }));
  });

  it('never adds logical links when they are explicitly excluded', () => {
    const compact = prepareAiContextDataset(
      logicalSelectionDataset({ source: 'service.a', target: ['service.b'], direction: '==>' }),
      { contextMode: 'compact' },
      'Покажи service.a и service.b без связей'
    );

    expect(compact['seaf.company.ta.services.logical_links']).toBeUndefined();
  });

  it('expands an adjacent logical-link request with the opposite endpoint', () => {
    const compact = prepareAiContextDataset(
      logicalSelectionDataset({ source: 'service.a', target: ['service.b'], direction: '==>' }),
      { contextMode: 'compact' },
      'Покажи связи service.a'
    );

    expect(compact['seaf.company.ta.services.logical_links']['link.test']).toBeDefined();
    expect(compact['seaf.company.ta.services.compute_services']['service.b']).toBeDefined();
  });

  it.each([
    'Покажи service.a и его связи',
    'Покажи service.a со связями',
    'Покажи service.a и входящие связи'
  ])('recognizes object-first adjacent form: %s', (prompt) => {
    const source = logicalSelectionDataset({
      source: 'service.a', target: ['service.b'], direction: '<==>'
    });

    expect(normalizeAiPrompt(prompt).logicalLinkScope).toBe('adjacent');
    const compact = prepareAiContextDataset(source, { contextMode: 'compact' }, prompt);
    expect(compact['seaf.company.ta.services.logical_links']['link.test']).toBeDefined();
  });

  it.each([
    'Покажи взаимодействия service.a',
    'Покажи links service.a',
    'Show links service.a'
  ])('recognizes link-first adjacent form: %s', (prompt) => {
    const source = logicalSelectionDataset({
      source: 'service.a', target: ['service.b'], direction: '==>'
    });
    const compact = prepareAiContextDataset(source, { contextMode: 'compact' }, prompt);

    expect(normalizeAiPrompt(prompt).logicalLinkScope).toBe('adjacent');
    expect(compact['seaf.company.ta.services.logical_links']['link.test']).toBeDefined();
    expect(compact['seaf.company.ta.services.compute_services']['service.b']).toBeDefined();
  });

  it('keeps a trailing bare "и связи" in between scope', () => {
    const source = logicalSelectionDataset({
      source: 'service.a', target: ['service.b'], direction: '==>'
    });
    source['seaf.company.ta.services.logical_links']['link.other'] = {
      title: 'Third-party link', source: 'service.a', target: ['service.c'], direction: '==>'
    };
    const prompt = 'Покажи service.a и service.b и связи';
    const compact = prepareAiContextDataset(source, { contextMode: 'compact' }, prompt);

    expect(normalizeAiPrompt(prompt).logicalLinkScope).toBe('between');
    expect(Object.keys(compact['seaf.company.ta.services.logical_links'])).toEqual(['link.test']);
    expect(compact['seaf.company.ta.services.compute_services']['service.c']).toBeUndefined();
  });

  it('expands all links adjacent to every monitoring selected by category', async() => {
    const source = structuredClone(validDataset);
    source['seaf.company.ta.services.monitorings']['monitoring.other'] = {
      title: 'Zabbix',
      role: ['Инфраструктурный'],
      ha: true,
      location: ['dc.main'],
      network_connection: ['network.main'],
      monitored_services: []
    };
    source['seaf.company.ta.services.logical_links']['link.second'] = {
      title: 'Zabbix link', source: 'kb.main', target: ['monitoring.other'], direction: '==>'
    };
    source['seaf.company.ta.services.logical_links']['link.unrelated'] = {
      title: 'Unrelated', source: 'kb.main', target: ['hw.storage.main'], direction: '==>'
    };
    const prompt = 'покажи мониторинг и все связи';
    const result = await generateValidatedDraft({
      prompt,
      currentDataset: source,
      responseMode: 'selection',
      send: jest.fn().mockResolvedValue(JSON.stringify({
        selected_oids: ['monitoring.main', 'monitoring.other']
      })),
      validate: jest.fn().mockResolvedValue({ valid: true, diagnostics: [] })
    });

    expect(normalizeAiPrompt(prompt).logicalLinkScope).toBe('adjacent');
    expect(result.valid).toBe(true);
    expect(Object.keys(result.dataset['seaf.company.ta.services.monitorings']).sort())
      .toEqual(['monitoring.main', 'monitoring.other']);
    expect(Object.keys(result.dataset['seaf.company.ta.services.logical_links']).sort())
      .toEqual(['link.main', 'link.second']);
    expect(result.dataset['seaf.company.ta.services.kbs']['kb.main']).toBeDefined();
    expect(result.dataset['seaf.company.ta.components.hw_storages']).toBeUndefined();
  });

  it('reconstructs Jupiter ELK outgoing link and its exact endpoints from selection', async() => {
    const source = {
      'seaf.company.ta.services.dc_regions': {
        'jupiter.dc_region.russia': { title: 'Россия' }
      },
      'seaf.company.ta.services.dc_azs': {
        'jupiter.dc_az.moscow': {
          title: 'Москва', vendor: 'Internal', region: 'jupiter.dc_region.russia'
        }
      },
      'seaf.company.ta.services.dcs': {
        'jupiter.dc.moscow_dc01': {
          title: 'DC01', vendor: 'Internal', availabilityzone: 'jupiter.dc_az.moscow'
        }
      },
      'seaf.company.ta.services.networks': {
        'jupiter.network.lan.dc01.int.it.services': {
          title: 'IT services',
          type: 'LAN',
          location: ['jupiter.dc.moscow_dc01'],
          lan_type: 'Проводная',
          ipnetwork: '10.0.0.0/24',
          segment: []
        }
      },
      'seaf.company.ta.services.monitorings': {
        'jupiter.monitoring.elk': {
          title: 'ELK',
          role: ['Журналирование'],
          ha: true,
          availabilityzone: ['jupiter.dc_az.moscow'],
          location: ['jupiter.dc.moscow_dc01'],
          network_connection: ['jupiter.network.lan.dc01.int.it.services'],
          monitored_services: ['jupiter.monitoring.zabbix', 'jupiter.kb.audit.siem']
        },
        'jupiter.monitoring.zabbix': {
          title: 'Zabbix',
          role: ['Инфраструктурный'],
          ha: true,
          availabilityzone: ['jupiter.dc_az.moscow'],
          location: ['jupiter.dc.moscow_dc01'],
          network_connection: ['jupiter.network.lan.dc01.int.it.services'],
          monitored_services: ['jupiter.monitoring.elk']
        }
      },
      'seaf.company.ta.services.softwares': {
        'jupiter.software.siem': {
          title: 'SIEM', vendor: 'Vendor', type: 'Закрытая платная', support: 'Да', expiration: '2030-01-01'
        }
      },
      'seaf.company.ta.services.kbs': {
        'jupiter.kb.audit.siem': {
          title: 'SIEM/Logs',
          technology: 'Аудит событий КБ',
          softwares: ['jupiter.software.siem'],
          tag: 'Log',
          status: 'Используется',
          network_connection: ['jupiter.network.lan.dc01.int.it.services'],
          protected_services: ['jupiter.monitoring.elk']
        }
      },
      'seaf.company.ta.services.logical_links': {
        'jupiter.link.kb_siem_from_monitoring': {
          title: 'Корреляция событий SIEM',
          description: 'SIEM получает события от ELK и Zabbix',
          direction: '==>',
          source: 'jupiter.monitoring.elk',
          target: ['jupiter.kb.audit.siem', 'jupiter.monitoring.zabbix'],
          topology: 'star',
          tags: ['kb-scheme-demo', 'siem']
        },
        'jupiter.link.incoming_to_elk': {
          title: 'Incoming only',
          direction: '==>',
          source: 'jupiter.monitoring.zabbix',
          target: ['jupiter.monitoring.elk'],
          topology: 'star'
        }
      }
    };
    const prompt = 'Покажи исходящие связи ELK';
    const currentDataset = prepareAiContextDataset(source, { contextMode: 'compact' }, prompt);
    expect(Object.keys(currentDataset['seaf.company.ta.services.logical_links']))
      .toEqual(['jupiter.link.kb_siem_from_monitoring']);
    const validate = jest.fn(async(dataset) => validateDatasetStructure(dataset));
    const result = await generateValidatedDraft({
      prompt,
      currentDataset,
      responseMode: 'selection',
      send: jest.fn().mockResolvedValue(JSON.stringify({
        selected_oids: ['jupiter.monitoring.elk']
      })),
      validate
    });

    expect(result.valid).toBe(true);
    expect(Object.keys(result.dataset['seaf.company.ta.services.logical_links']))
      .toEqual(['jupiter.link.kb_siem_from_monitoring']);
    expect(result.dataset['seaf.company.ta.services.monitorings']['jupiter.monitoring.elk']).toBeDefined();
    expect(result.dataset['seaf.company.ta.services.monitorings']['jupiter.monitoring.zabbix']).toBeDefined();
    expect(result.dataset['seaf.company.ta.services.kbs']['jupiter.kb.audit.siem']).toBeDefined();
    expect(result.dataset['seaf.company.ta.services.networks']['jupiter.network.lan.dc01.int.it.services']).toBeDefined();
    expect(validate).toHaveBeenCalledTimes(1);
  });

  it('does not treat the adjective "связанные" as an adjacent-link request', () => {
    const source = {
      'seaf.company.ta.components.networks': {
        'device.a': { title: 'Router' }
      },
      'seaf.company.ta.services.compute_services': {
        'service.b': { title: 'Beta' }
      },
      'seaf.company.ta.services.logical_links': {
        'link.test': {
          title: 'Router link', source: 'device.a', target: ['service.b'], direction: '==>'
        }
      }
    };
    const prompt = 'Покажи связанные сетевые устройства';
    const intent = normalizeAiPrompt(prompt);
    const compact = prepareAiContextDataset(source, { contextMode: 'compact' }, prompt);

    expect(intent.logicalLinksRequested).toBe(false);
    expect(intent.logicalLinkScope).toBe('between');
    expect(compact['seaf.company.ta.services.logical_links']).toBeUndefined();
  });

  it('selects one logical link by its exact title instead of all links', () => {
    const source = logicalSelectionDataset({
      source: 'service.a', target: ['service.b'], direction: '==>'
    });
    source['seaf.company.ta.services.logical_links']['link.other'] = {
      title: 'Other link', source: 'service.a', target: ['service.c'], direction: '==>'
    };

    const compact = prepareAiContextDataset(
      source,
      { contextMode: 'compact' },
      'Покажи логическую связь Test link'
    );

    expect(Object.keys(compact['seaf.company.ta.services.logical_links'])).toEqual(['link.test']);
    expect(Object.keys(compact['seaf.company.ta.services.compute_services']).sort())
      .toEqual(['service.a', 'service.b']);
  });

  it.each([
    ['==>', 'incoming', 'service.b', true],
    ['==>', 'incoming', 'service.a', false],
    ['==>', 'outgoing', 'service.a', true],
    ['==>', 'outgoing', 'service.b', false],
    ['<==', 'incoming', 'service.a', true],
    ['<==', 'incoming', 'service.b', false],
    ['<==', 'outgoing', 'service.b', true],
    ['<==', 'outgoing', 'service.a', false],
    ['<==>', 'incoming', 'service.a', true],
    ['<==>', 'incoming', 'service.b', true],
    ['<==>', 'outgoing', 'service.a', true],
    ['<==>', 'outgoing', 'service.b', true]
  ])('uses semantic direction %s for %s links of %s', (direction, requestDirection, oid, expected) => {
    const promptDirection = requestDirection === 'incoming' ? 'входящие' : 'исходящие';
    const compact = prepareAiContextDataset(
      logicalSelectionDataset({ source: 'service.a', target: ['service.b'], direction }),
      { contextMode: 'compact' },
      `Покажи ${promptDirection} связи ${oid}`
    );

    expect(Boolean(compact['seaf.company.ta.services.logical_links']?.['link.test'])).toBe(expected);
  });

  it.each([
    ['star', 'service.a', 'исходящие', true],
    ['star', 'service.b', 'исходящие', false],
    ['chain', 'service.b', 'исходящие', true],
    ['chain', 'service.b', 'входящие', true]
  ])('expands %s topology into ordered endpoint pairs', (topology, oid, direction, expected) => {
    const compact = prepareAiContextDataset(
      logicalSelectionDataset({
        source: 'service.a', target: ['service.b', 'service.c'], direction: '==>', topology
      }),
      { contextMode: 'compact' },
      `Покажи ${direction} связи ${oid}`
    );

    expect(Boolean(compact['seaf.company.ta.services.logical_links']?.['link.test'])).toBe(expected);
    if (expected) {
      expect(Object.keys(compact['seaf.company.ta.services.compute_services']).sort()).toEqual([
        'service.a', 'service.b', 'service.c'
      ]);
    }
  });

  it('keeps the prompt catalog synchronized with every metamodel schema in render patterns', () => {
    const renderedSchemas = new Set([mainPatterns, officePatterns, dcPatterns]
      .flatMap((patterns) => Object.values(patterns))
      .map(({ schema }) => schema)
      .filter((schema) => schema?.startsWith('seaf.company.ta.')));
    const catalogSchemas = new Set(AI_PROMPT_SCHEMA_CATALOG.map(({ schema }) => schema));

    expect(catalogSchemas).toEqual(renderedSchemas);
  });

  it('limits compact context to prompt matches, dependencies and their logical links', () => {
    const source = structuredClone(validDataset);
    source['seaf.company.ta.services.monitorings']['monitoring.other'] = {
      title: 'Unrelated Jaeger',
      role: ['Трейсинг'],
      ha: false,
      network_connection: ['network.main'],
      monitored_services: []
    };
    source['seaf.company.ta.services.logical_links']['link.other'] = {
      title: 'Unrelated link',
      source: 'monitoring.other',
      target: ['kb.main'],
      direction: '==>'
    };

    const compact = prepareAiContextDataset(
      source,
      { contextMode: 'compact' },
      'Покажи Monitoring, KB и связь link.main. OID: monitoring.main, kb.main'
    );

    expect(compact['seaf.company.ta.services.monitorings']['monitoring.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.monitorings']['monitoring.other']).toBeUndefined();
    expect(compact['seaf.company.ta.services.logical_links']['link.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.logical_links']['link.other']).toBeUndefined();
    expect(compact['seaf.company.ta.services.networks']['network.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.dcs']['dc.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.dc_azs']['az.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.dc_regions']['region.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.softwares']['jupiter.software.siem']).toBeDefined();
  });

  it.each([
    'Оставь на схеме только сетевывые устройства и подключенные сети',
    'Оставь на схеме только сетевывые устройства и сети'
  ])('includes network devices and their networks for prompt: %s', (prompt) => {
    const source = structuredClone(validDataset);
    source['seaf.company.ta.components.networks'] = {
      'network-device.main': {
        title: 'Router',
        type: 'Маршрутизатор (роутер)',
        location: ['dc.main'],
        segment: 'segment.main',
        network_connection: ['network.main']
      }
    };

    const compact = prepareAiContextDataset(source, { contextMode: 'compact' }, prompt);

    expect(compact['seaf.company.ta.components.networks']['network-device.main']).toEqual(expect.objectContaining({
      network_connection: ['network.main'],
      location: ['dc.main'],
      segment: 'segment.main'
    }));
    expect(compact['seaf.company.ta.services.networks']['network.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.logical_links']).toBeUndefined();
  });

  it('keeps Kubernetes placement dependencies for the exact category prompt', () => {
    const source = structuredClone(validDataset);
    source['seaf.company.ta.services.k8s'] = {
      'k8s.main': {
        title: 'Kubernetes cluster',
        availabilityzone: ['az.main'],
        location: ['dc.main'],
        network_connection: ['network.main']
      }
    };

    const compact = prepareAiContextDataset(
      source,
      { contextMode: 'compact' },
      'Оставь на схеме только сервисы мониторинга и kubernetes'
    );

    expect(compact['seaf.company.ta.services.monitorings']['monitoring.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.k8s']['k8s.main']).toEqual(expect.objectContaining({
      availabilityzone: ['az.main'],
      location: ['dc.main'],
      network_connection: ['network.main']
    }));
    expect(compact['seaf.company.ta.services.networks']['network.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.dcs']['dc.main']).toBeDefined();
  });

  it.each([
    ['seaf.company.ta.components.user_devices', 'user-device.main', {
      title: 'Workstation', device_type: 'АРМ', location: ['dc.main'], segment: 'segment.main', network_connection: ['network.main']
    }],
    ['seaf.company.ta.services.compute_services', 'compute.main', {
      title: 'Application server', service_type: 'Серверы приложений и т.д.', availabilityzone: ['az.main'], location: ['dc.main'], network_connection: ['network.main']
    }],
    ['seaf.company.ta.services.cluster_virtualizations', 'virtualization.main', {
      title: 'VMware', hypervisor: 'VMware vSphere', deployment_model: 'onprem', availabilityzone: ['az.main'], location: ['dc.main'], network_connection: ['network.main']
    }],
    ['seaf.company.ta.services.backups', 'backup.main', {
      title: 'Backup', path: '/backup', backed_up_services: [], availabilityzone: ['az.main'], location: ['dc.main'], network_connection: ['network.main']
    }]
  ])('keeps placement dependencies for %s', (schema, oid, entity) => {
    const source = structuredClone(validDataset);
    source[schema] = { [oid]: entity };

    const compact = prepareAiContextDataset(source, { contextMode: 'compact' }, oid);

    expect(compact[schema][oid]).toEqual(expect.objectContaining({
      location: ['dc.main'],
      network_connection: ['network.main']
    }));
    expect(compact['seaf.company.ta.services.networks']['network.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.dcs']['dc.main']).toBeDefined();
  });

  it('recognizes monitoring services and KB tools as two schema intents', () => {
    const compact = prepareAiContextDataset(
      validDataset,
      { contextMode: 'compact' },
      'Оставь на схеме только сервисы мониторинга и средства КБ'
    );

    expect(compact['seaf.company.ta.services.monitorings']['monitoring.main']).toBeDefined();
    expect(compact['seaf.company.ta.services.kbs']['kb.main']).toBeDefined();
  });

  it('maps a broad human-language prompt dictionary to exact objects and links', async() => {
    const commandTemplates = [
      'Покажи %s',
      'Покажи на схеме %s',
      'Покажи мне %s',
      'Нарисуй %s',
      'Нарисуй на схеме %s',
      'Отрисуй %s',
      'Отобрази %s',
      'Отобрази на схеме %s',
      'Выведи %s',
      'Добавь на схему %s',
      'Визуализируй %s',
      'Оставь только %s',
      'Оставь на схеме только %s',
      'Хочу увидеть %s',
      'Мне нужны %s',
      'Пожалуйста, покажи %s',
      'Нужно показать %s',
      'Сформируй схему: %s',
      'Покажи, пожалуйста, %s',
      'Можешь показать %s?',
      'Можно показать %s?',
      'Давай отобразим %s',
      'Необходимо показать %s',
      'Хотелось бы увидеть %s'
    ];
    const expected = (objects, links = []) => ({
      objects: HUMAN_OBJECT_OIDS.filter((oid) => objects.includes(oid)),
      links: HUMAN_LINK_OIDS.filter((oid) => links.includes(oid))
    });
    const requestTargets = [
      {
        phrase: 'мониторинг',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix'],
        expected: expected(['monitoring.elk', 'monitoring.zabbix'], ['link.elk-zabbix'])
      },
      {
        phrase: 'ELK',
        selectedOids: ['monitoring.elk'],
        expected: expected(['monitoring.elk'])
      },
      {
        phrase: 'ELK и Zabbix',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix'],
        expected: expected(['monitoring.elk', 'monitoring.zabbix'], ['link.elk-zabbix'])
      },
      {
        phrase: 'средства КБ и ELK',
        selectedOids: ['kb.main', 'monitoring.elk'],
        expected: expected(['kb.main', 'monitoring.elk'], ['link.elk-siem'])
      },
      {
        phrase: 'мониторинг и Kubernetes',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix', 'k8s.main'],
        expected: expected(
          ['monitoring.elk', 'monitoring.zabbix', 'k8s.main'],
          ['link.elk-zabbix', 'link.k8s-zabbix']
        )
      },
      {
        phrase: 'мониторинг и бэкап',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix', 'backup.main'],
        expected: expected(
          ['monitoring.elk', 'monitoring.zabbix', 'backup.main'],
          ['link.backup-elk', 'link.elk-zabbix']
        )
      },
      {
        phrase: 'мониторинг, Kubernetes и средства КБ',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix', 'k8s.main', 'kb.main'],
        expected: expected(
          ['monitoring.elk', 'monitoring.zabbix', 'k8s.main', 'kb.main'],
          ['link.elk-siem', 'link.elk-zabbix', 'link.k8s-zabbix']
        )
      },
      {
        phrase: 'ELK, Zabbix и средства КБ',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix', 'kb.main'],
        expected: expected(
          ['monitoring.elk', 'monitoring.zabbix', 'kb.main'],
          ['link.elk-siem', 'link.elk-zabbix']
        )
      }
    ];
    const cases = commandTemplates.flatMap((template) => requestTargets.map((target) => ({
      prompt: template.replace('%s', target.phrase),
      selectedOids: target.selectedOids,
      expected: target.expected
    })));
    const vocabularyCases = [
      ['Покажи сервисы мониторинга', ['monitoring.elk', 'monitoring.zabbix'], ['link.elk-zabbix']],
      ['Покажи систему мониторинга', ['monitoring.elk', 'monitoring.zabbix'], ['link.elk-zabbix']],
      ['Покажи monitoring', ['monitoring.elk', 'monitoring.zabbix'], ['link.elk-zabbix']],
      ['Покажи маниторинг', ['monitoring.elk', 'monitoring.zabbix'], ['link.elk-zabbix']],
      ['Покажи средства ИБ', ['kb.main'], []],
      ['Покажи средства ЭКБ', ['kb.main'], []],
      ['Покажи средства УКБ', ['kb.main'], []],
      ['Покажи кибербезопасность', ['kb.main'], []],
      ['Покажи системы информационной безопасности', ['kb.main'], []],
      ['Покажи KB', ['kb.main'], []],
      ['Покажи K8s', ['k8s.main'], []],
      ['Покажи kubernetes', ['k8s.main'], []],
      ['Покажи кубернетес', ['k8s.main'], []],
      ['Покажи кубер', ['k8s.main'], []],
      ['Покажи контейнерные кластеры', ['k8s.main'], []],
      ['Покажи бекап', ['backup.main'], []],
      ['Покажи бэкап', ['backup.main'], []],
      ['Покажи резервное копирование', ['backup.main'], []],
      ['Покажи backup', ['backup.main'], []],
      ['Покажи elk', ['monitoring.elk'], []],
      ['Покажи Elk', ['monitoring.elk'], []],
      ['Покажи zabbix', ['monitoring.zabbix'], []],
      ['Покажи ZABBIX', ['monitoring.zabbix'], []],
      ['Покажи ELK, Zabbix', ['monitoring.elk', 'monitoring.zabbix'], ['link.elk-zabbix']],
      ['Покажи ELK + Zabbix', ['monitoring.elk', 'monitoring.zabbix'], ['link.elk-zabbix']],
      ['Покажи monitoring + k8s + ИБ', ['monitoring.elk', 'monitoring.zabbix', 'k8s.main', 'kb.main'], ['link.elk-siem', 'link.elk-zabbix', 'link.k8s-zabbix']],
      ['Покажи средства УКБ и elk', ['kb.main', 'monitoring.elk'], ['link.elk-siem']]
    ];
    cases.push(...vocabularyCases.map(([prompt, selectedOids, links]) => ({
      prompt,
      selectedOids,
      expected: expected(selectedOids, links)
    })));

    const anyElkLinks = expected(
      ['backup.main', 'kb.main', 'monitoring.elk', 'monitoring.zabbix'],
      ['link.backup-elk', 'link.elk-siem', 'link.elk-zabbix']
    );
    const linkTargets = [
      {
        phrase: 'исходящие связи ELK',
        selectedOids: ['monitoring.elk'],
        expected: expected(
          ['kb.main', 'monitoring.elk', 'monitoring.zabbix'],
          ['link.elk-siem', 'link.elk-zabbix']
        )
      },
      {
        phrase: 'входящие связи ELK',
        selectedOids: ['monitoring.elk'],
        expected: expected(['backup.main', 'monitoring.elk'], ['link.backup-elk'])
      },
      { phrase: 'все связи ELK', selectedOids: ['monitoring.elk'], expected: anyElkLinks },
      { phrase: 'связи ELK', selectedOids: ['monitoring.elk'], expected: anyElkLinks }
    ];
    cases.push(...commandTemplates.flatMap((template) => linkTargets.map((target) => ({
      prompt: template.replace('%s', target.phrase),
      selectedOids: target.selectedOids,
      expected: target.expected
    }))));
    cases.push(
      { prompt: 'Покажи зависимости ELK', selectedOids: ['monitoring.elk'], expected: anyElkLinks },
      { prompt: 'Покажи взаимодействия ELK', selectedOids: ['monitoring.elk'], expected: anyElkLinks },
      { prompt: 'Покажи взаимосвязи ELK', selectedOids: ['monitoring.elk'], expected: anyElkLinks },
      { prompt: 'Покажи links ELK', selectedOids: ['monitoring.elk'], expected: anyElkLinks },
      { prompt: 'Покажи ELK и его связи', selectedOids: ['monitoring.elk'], expected: anyElkLinks },
      { prompt: 'Отобрази ELK со связями', selectedOids: ['monitoring.elk'], expected: anyElkLinks },
      { prompt: 'Нарисуй ELK со всеми связями', selectedOids: ['monitoring.elk'], expected: anyElkLinks },
      { prompt: 'Покажи ELK вместе со связями', selectedOids: ['monitoring.elk'], expected: anyElkLinks },
      {
        prompt: 'Покажи ELK и входящие связи',
        selectedOids: ['monitoring.elk'],
        expected: expected(['backup.main', 'monitoring.elk'], ['link.backup-elk'])
      },
      {
        prompt: 'Покажи ELK и исходящие связи',
        selectedOids: ['monitoring.elk'],
        expected: expected(
          ['kb.main', 'monitoring.elk', 'monitoring.zabbix'],
          ['link.elk-siem', 'link.elk-zabbix']
        )
      },
      {
        prompt: 'Покажи ELK и Zabbix и связи',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix'],
        expected: expected(['monitoring.elk', 'monitoring.zabbix'], ['link.elk-zabbix'])
      },
      {
        prompt: 'Покажи ELK и Zabbix без связей',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix'],
        expected: expected(['monitoring.elk', 'monitoring.zabbix'])
      },
      {
        prompt: 'Покажи мониторинг и все связи',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix'],
        expected: expected(HUMAN_OBJECT_OIDS, HUMAN_LINK_OIDS)
      },
      {
        prompt: 'Покажи средства УКБ и ELK и все связи',
        selectedOids: ['kb.main', 'monitoring.elk'],
        expected: anyElkLinks
      },
      {
        prompt: 'Покажи ELK и Zabbix и все связи',
        selectedOids: ['monitoring.elk', 'monitoring.zabbix'],
        expected: expected(HUMAN_OBJECT_OIDS, HUMAN_LINK_OIDS)
      }
    );

    const failures = [];
    for (const testCase of cases) {
      try {
        const context = prepareAiContextDataset(
          humanLanguageDataset,
          { contextMode: 'compact' },
          testCase.prompt
        );
        const contextSelection = humanSelectionSnapshot(context);
        if (JSON.stringify(contextSelection) !== JSON.stringify(testCase.expected)) {
          failures.push({ prompt: testCase.prompt, stage: 'context', expected: testCase.expected, actual: contextSelection });
          continue;
        }
        const result = await generateValidatedDraft({
          prompt: testCase.prompt,
          currentDataset: context,
          responseMode: 'selection',
          send: jest.fn().mockResolvedValue(JSON.stringify({ selected_oids: testCase.selectedOids })),
          validate: jest.fn().mockResolvedValue({ valid: true, diagnostics: [] })
        });
        const resultSelection = humanSelectionSnapshot(result.dataset);
        if (!result.valid || JSON.stringify(resultSelection) !== JSON.stringify(testCase.expected)) {
          failures.push({
            prompt: testCase.prompt,
            stage: 'selection',
            expected: testCase.expected,
            actual: resultSelection,
            diagnostics: result.validation?.diagnostics
          });
        }
      } catch (error) {
        failures.push({ prompt: testCase.prompt, stage: 'exception', error: error.message });
      }
    }

    expect(cases).toHaveLength(330);
    expect(failures).toEqual([]);
  });

  it.each([
    ...['Покажи', 'Нарисуй', 'Отрисуй', 'Оставь'].flatMap((verb) => [
      [verb, 'monitoring, Kubernetes и средства КБ', ['monitoring.main', 'k8s.main', 'kb.main']],
      [verb, 'monitoring и бекап', ['monitoring.main', 'backup.main']],
      [verb, 'сетевые устройства и сети', ['network-device.main', 'network-device.peer', 'network.main', 'network.external', 'network.edge']],
      [verb, 'Внешние подключения', ['network.external', 'network.edge', 'network-device.main', 'network-device.peer', 'network-link.external']]
    ])
  ])('deterministically completes an isolated selection for %s %s', async(verb, categories, expectedOids) => {
    const omitted = expectedOids.slice(0, -1);
    const send = jest.fn().mockResolvedValue(JSON.stringify({
      selected_oids: omitted.length ? omitted : ['network.main']
    }));

    const prompt = `${verb} ${categories}`;
    const result = await generateValidatedDraft({
      prompt,
      currentDataset: prepareAiContextDataset(selectionMatrixDataset, { contextMode: 'compact' }, prompt),
      responseMode: 'selection',
      send,
      validate: jest.fn().mockResolvedValue({ valid: true, diagnostics: [] })
    });

    expect(result.valid).toBe(true);
    expect(result.attempts).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
    const resultOids = new Set(Object.values(result.dataset).flatMap((entities) => Object.keys(entities)));
    expectedOids.forEach((oid) => expect(resultOids).toContain(oid));
    if (categories === 'Внешние подключения') {
      expect(result.dataset['seaf.company.ta.services.networks']['network.main']).toBeUndefined();
      expect(result.dataset['seaf.company.ta.services.network_segments']['segment.external']).toBeDefined();
      expect(result.dataset['seaf.company.ta.services.dcs']['dc.main']).toBeDefined();
      expect(result.dataset['seaf.company.ta.components.networks']['network-device.main'].network_connection)
        .toEqual(['network.external', 'network.edge']);
      expect(result.dataset['seaf.company.ta.components.networks']['network-device.main'].network_connection_devices)
        .toEqual(['network-device.peer', 'network-link.external']);
    }
  });

  it('matches exact OIDs and titles instead of their prefixes', () => {
    const regions = {
      'seaf.company.ta.services.dc_regions': {
        'region.1': { title: 'North' },
        'region.10': { title: 'Northwest' }
      }
    };

    expect(prepareAiContextDataset(regions, { contextMode: 'compact' }, 'Покажи region.10'))
      .toEqual({ 'seaf.company.ta.services.dc_regions': { 'region.10': { title: 'Northwest' } } });
    expect(prepareAiContextDataset(
      regions,
      { contextMode: 'compact' },
      'Покажи OID seaf.company.ta.services.dc_regions.region.10'
    )).toEqual({ 'seaf.company.ta.services.dc_regions': { 'region.10': { title: 'Northwest' } } });
    expect(prepareAiContextDataset(regions, { contextMode: 'compact' }, 'Покажи North'))
      .toEqual({ 'seaf.company.ta.services.dc_regions': { 'region.1': { title: 'North' } } });
  });

  it('reports the compact selection limit instead of silently dropping objects', () => {
    const regions = Object.fromEntries(Array.from({ length: 201 }, (_, index) => [
      `region.${index}`,
      { title: `Region ${index}` }
    ]));

    expect(() => prepareAiContextDataset(
      { 'seaf.company.ta.services.dc_regions': regions },
      { contextMode: 'compact' },
      'Оставь регионы'
    )).toThrow('201 объектов при лимите 200');
  });

  it('reports the same limit when adjacent logical-link endpoints overflow it', () => {
    const services = Object.fromEntries(Array.from({ length: 201 }, (_, index) => [
      `service.${index}`,
      { title: `Service ${index}` }
    ]));

    expect(() => prepareAiContextDataset({
      'seaf.company.ta.services.compute_services': services,
      'seaf.company.ta.services.logical_links': {
        'link.fanout': {
          title: 'Fanout',
          source: 'service.0',
          target: Object.keys(services).slice(1),
          direction: '==>'
        }
      }
    }, { contextMode: 'compact' }, 'Покажи связи service.0'))
      .toThrow('превышает лимит 200 объектов');
  });

  it('parses one fenced YAML selection response', async() => {
    const result = await generateValidatedDraft({
      prompt: 'Покажи monitoring.main',
      currentDataset: validDataset,
      send: jest.fn().mockResolvedValue('```yaml\nselected_oids:\n  - monitoring.main\n```'),
      validate: jest.fn().mockResolvedValue({ valid: true, diagnostics: [] })
    });
    expect(result.valid).toBe(true);
    expect(result.dataset['seaf.company.ta.services.monitorings']['monitoring.main']).toBeDefined();
  });

  it.each([
    ['two fenced blocks', '```yaml\na: b\n```\n```yaml\nc: d\n```'],
    ['scalar', 'hello'],
    ['array', '- one\n- two'],
    ['prototype key', 'seaf.company.ta.services.dc_regions:\n  region.main:\n    title: Main\n    __proto__: bad']
  ])('rejects unsafe or ambiguous selection response: %s', async(name, response) => {
    const result = await generateValidatedDraft({
      prompt: 'Покажи monitoring.main',
      currentDataset: validDataset,
      maxAttempts: 1,
      send: jest.fn().mockResolvedValue(response),
      validate: jest.fn()
    });
    expect(result.valid).toBe(false);
    expect(result.attempts[0].diagnostics).toContainEqual(expect.objectContaining({ code: 'parse_error' }));
  });

  it('accepts supported connected dataset', () => {
    expect(validateDatasetStructure(validDataset)).toEqual(expect.objectContaining({
      valid: true,
      entityCount: 11,
      schemaCount: 11
    }));
  });

  it('rejects unsupported schemas, duplicate IDs and missing references', () => {
    const report = validateDatasetStructure({
      'seaf.company.ta.services.unknown': {
        duplicate: { title: 'Unknown' }
      },
      'seaf.company.ta.services.monitorings': {
        duplicate: { title: 'Monitoring', network_connection: 'missing.network' }
      }
    });
    expect(report.valid).toBe(false);
    expect(report.diagnostics.map(({ code }) => code)).toEqual(expect.arrayContaining([
      'unsupported_schema',
      'duplicate_oid',
      'missing_reference'
    ]));
  });

  it('checks availabilityzone references used by real datasets', () => {
    const dataset = structuredClone(validDataset);
    dataset['seaf.company.ta.services.dcs']['dc.main'].availabilityzone = 'az.missing';
    const report = validateDatasetStructure(dataset);
    expect(report.diagnostics).toContainEqual(expect.objectContaining({
      code: 'missing_reference',
      field: 'availabilityzone',
      reference: 'az.missing'
    }));
  });

  it('rejects supported input OIDs that are absent from generated XML coverage', () => {
    const coverage = validateDrawnCoverage(validDataset, {
      drawn: {
        'seaf.company.ta.services.dc_regions': ['region.main'],
        'seaf.company.ta.services.dc_offices': ['office.main'],
        'seaf.company.ta.services.network_segments': ['segment.main'],
        'seaf.company.ta.services.networks': ['network.main']
      }
    });
    expect(coverage.valid).toBe(false);
    expect(coverage.missing['seaf.company.ta.services.monitorings']).toEqual(['monitoring.main']);
    expect(coverage.missing['seaf.company.ta.services.kbs']).toEqual(['kb.main']);
  });

  it('rejects monitoring and KB objects without network placement', () => {
    const dataset = structuredClone(validDataset);
    delete dataset['seaf.company.ta.services.monitorings']['monitoring.main'].network_connection;
    delete dataset['seaf.company.ta.services.kbs']['kb.main'].network_connection;
    const report = validateDatasetStructure(dataset);
    expect(report.diagnostics.filter(({ code }) => code === 'missing_network_placement')).toHaveLength(2);
  });

  it('rejects the live-acceptance invalid field shapes and direction', () => {
    const dataset = structuredClone(validDataset);
    dataset['seaf.company.ta.services.logical_links']['link.main'].direction = '=>';
    dataset['seaf.company.ta.services.monitorings']['monitoring.main'] = {
      title: 'Broken monitoring',
      role: 'Инфраструктурный',
      ha: 'true',
      network_connection: 'network.main'
    };
    dataset['seaf.company.ta.services.kbs']['kb.main'] = {
      title: 'Broken KB',
      technology: 'Аудит событий КБ',
      tag: 'WAF',
      status: 'Активен',
      network_connection: 'network.main'
    };

    const report = validateDatasetStructure(dataset);
    expect(report.valid).toBe(false);
    expect(report.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'invalid_enum', field: 'direction', value: '=>' }),
      expect.objectContaining({ code: 'invalid_field_type', field: 'role' }),
      expect.objectContaining({ code: 'invalid_field_type', field: 'ha' }),
      expect.objectContaining({ code: 'required_field', field: 'monitored_services' }),
      expect.objectContaining({ code: 'required_field', field: 'softwares' }),
      expect.objectContaining({ code: 'invalid_enum', field: 'status', value: 'Активен' }),
      expect.objectContaining({ code: 'invalid_kb_variant' })
    ]));
  });

  it('allows non-drawable software to satisfy KB references without XML coverage', () => {
    const drawn = Object.fromEntries(Object.entries(validDataset)
      .filter(([schema]) => schema !== 'seaf.company.ta.services.softwares')
      .map(([schema, entities]) => [schema, Object.keys(entities)]));
    expect(validateDatasetStructure(validDataset).valid).toBe(true);
    expect(validateDrawnCoverage(validDataset, { drawn }).valid).toBe(true);
  });

  it('allows component HW storage as a non-drawable protected service', () => {
    const dataset = structuredClone(validDataset);
    dataset['seaf.company.ta.services.kbs']['kb.main'].protected_services = ['hw.storage.main'];
    const drawn = Object.fromEntries(Object.entries(dataset)
      .filter(([schema]) => !['seaf.company.ta.services.softwares', 'seaf.company.ta.components.hw_storages'].includes(schema))
      .map(([schema, entities]) => [schema, Object.keys(entities)]));
    expect(validateDatasetStructure(dataset).valid).toBe(true);
    expect(validateDrawnCoverage(dataset, { drawn }).valid).toBe(true);
  });

  it('does not accept the phantom service HW storage namespace', () => {
    const dataset = structuredClone(validDataset);
    dataset['seaf.company.ta.services.hw_storages'] = {
      'hw.phantom': { title: 'Phantom', vendor: 'Vendor', volume: 10, location: ['dc.main'] }
    };
    expect(validateDatasetStructure(dataset).diagnostics).toContainEqual(expect.objectContaining({
      code: 'unsupported_schema',
      schema: 'seaf.company.ta.services.hw_storages'
    }));
  });

  it('rejects existing OIDs from wrong target schemas', () => {
    const dataset = structuredClone(validDataset);
    dataset['seaf.company.ta.services.kbs']['kb.main'].softwares = ['dc.main'];
    dataset['seaf.company.ta.services.kbs']['kb.main'].network_connection = ['monitoring.main'];
    dataset['seaf.company.ta.services.monitorings']['monitoring.main'].network_connection = ['kb.main'];
    dataset['seaf.company.ta.services.monitorings']['monitoring.main'].monitored_services = ['jupiter.software.siem'];
    dataset['seaf.company.ta.services.kbs']['kb.main'].protected_services = ['kb.main'];

    const report = validateDatasetStructure(dataset);
    expect(report.valid).toBe(false);
    expect(report.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'invalid_reference_target', id: 'kb.main', field: 'softwares', targetSchema: 'seaf.company.ta.services.dcs' }),
      expect.objectContaining({ code: 'invalid_reference_target', id: 'kb.main', field: 'network_connection', targetSchema: 'seaf.company.ta.services.monitorings' }),
      expect.objectContaining({ code: 'invalid_reference_target', id: 'monitoring.main', field: 'network_connection', targetSchema: 'seaf.company.ta.services.kbs' }),
      expect.objectContaining({ code: 'invalid_reference_target', id: 'monitoring.main', field: 'monitored_services', targetSchema: 'seaf.company.ta.services.softwares' }),
      expect.objectContaining({ code: 'invalid_reference_target', id: 'kb.main', field: 'protected_services', targetSchema: 'seaf.company.ta.services.kbs' })
    ]));
  });

  it('accepts software OIDs owned by the software schema', () => {
    const dataset = structuredClone(validDataset);
    dataset['seaf.company.ta.services.softwares']['bad.software'] = {
      ...dataset['seaf.company.ta.services.softwares']['jupiter.software.siem'],
      title: 'Bad software'
    };
    dataset['seaf.company.ta.services.kbs']['kb.main'].softwares = ['bad.software'];
    const report = validateDatasetStructure(dataset);
    expect(report.valid).toBe(true);
  });

  it('checks DC, location, segment and logical endpoint target schemas', () => {
    const dataset = structuredClone(validDataset);
    dataset['seaf.company.ta.services.dcs']['dc.main'].availabilityzone = 'office.main';
    dataset['seaf.company.ta.services.dc_azs']['az.main'].region = 'dc.main';
    dataset['seaf.company.ta.services.networks']['network.main'].location = ['az.main'];
    dataset['seaf.company.ta.services.networks']['network.main'].segment = ['network.main'];
    dataset['seaf.company.ta.services.network_segments']['segment.main'].location = 'az.main';
    dataset['seaf.company.ta.services.logical_links']['link.main'].source = 'jupiter.software.siem';
    dataset['seaf.company.ta.services.logical_links']['link.main'].target = ['jupiter.software.siem'];
    const diagnostics = validateDatasetStructure(dataset).diagnostics;
    for (const field of ['availabilityzone', 'region', 'location', 'segment', 'source', 'target']) {
      expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_reference_target', field }));
    }
  });

  it('aborts a stale generation before an LLM stream is created', () => {
    expect(() => assertGenerationCurrent(4, 5)).toThrow('Генерация отменена');
    expect(() => assertGenerationCurrent(5, 5)).not.toThrow();
  });

  it('enforces the entity cap', () => {
    const tooMany = Object.fromEntries(Array.from({ length: 5001 }, (_, index) => [
      `region.${index}`,
      { title: `Region ${index}` }
    ]));
    expect(validateDatasetStructure({
      'seaf.company.ta.services.dc_regions': tooMany
    }).diagnostics).toContainEqual(expect.objectContaining({ code: 'too_many_entities' }));

  });

  it('enforces depth and string caps for selection responses', async() => {
    let deep = { selected_oids: ['monitoring.main'] };
    for (let index = 0; index < 32; index += 1) deep = { nested: deep };
    for (const response of [deep, { selected_oids: ['monitoring.main'], title: 'x'.repeat(50001) }]) {
      const result = await generateValidatedDraft({
        prompt: 'Покажи monitoring.main',
        currentDataset: validDataset,
        maxAttempts: 1,
        send: jest.fn().mockResolvedValue(response),
        validate: jest.fn()
      });
      expect(result.valid).toBe(false);
      expect(result.attempts[0].diagnostics[0].message).toMatch(/максимальная глубина|длиннее 50000/);
    }
  });

  it('compacts object-shaped render diagnostics and composition errors deterministically', () => {
    const diagnostics = compactValidationReport({
      diagnostics: {
        schema: [{ id: 'object.1', reason: 'parent missing' }]
      },
      missing: { schema: ['object.1'] },
      compositionDiagnostics: [{ code: 'render_error', message: 'render failed' }]
    });
    expect(diagnostics.map(({ code }) => code)).toEqual([
      'not_drawn',
      'render_diagnostic',
      'render_error'
    ]);
  });

  it('repairs an invalid selection and stops after a valid second attempt', async() => {
    const responses = [
      'not a selection',
      JSON.stringify({ selected_oids: ['monitoring.main'] })
    ];
    const send = jest.fn(async() => responses.shift());
    const validate = jest.fn(async() => ({ valid: true, diagnostics: [] }));

    const result = await generateValidatedDraft({
      prompt: 'Покажи monitoring.main',
      currentDataset: validDataset,
      send,
      validate,
      maxAttempts: 3
    });

    expect(result.valid).toBe(true);
    expect(result.attempts).toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toContain('Предыдущий ответ не прошёл');
    expect(validate).toHaveBeenCalledTimes(1);
  });

  it('passes selection validation diagnostics to the repair attempt', async() => {
    const send = jest.fn().mockResolvedValue(JSON.stringify({ selected_oids: ['monitoring.main'] }));
    const validate = jest.fn()
      .mockResolvedValueOnce({
        valid: false,
        diagnostics: [{ code: 'invalid_reference_target', message: 'reference target is invalid' }]
      })
      .mockResolvedValueOnce({ valid: true, diagnostics: [] });

    const result = await generateValidatedDraft({
      prompt: 'Покажи monitoring.main',
      currentDataset: validDataset,
      send,
      validate,
      maxAttempts: 3
    });

    expect(result.valid).toBe(true);
    expect(result.attempts).toHaveLength(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toContain('invalid_reference_target');
    expect(validate).toHaveBeenCalledTimes(2);
  });

  it('uses at most three selection attempts and requires explicit valid=true', async() => {
    const send = jest.fn().mockResolvedValue(JSON.stringify({ selected_oids: ['monitoring.main'] }));
    const validate = jest.fn(async() => ({ allMatch: true, diagnostics: [] }));

    const result = await generateValidatedDraft({
      prompt: 'Build a scheme',
      currentDataset: validDataset,
      send,
      validate,
      maxAttempts: 20
    });

    expect(result.valid).toBe(false);
    expect(result.attempts).toHaveLength(3);
    expect(send).toHaveBeenCalledTimes(3);
    expect(result.dataset).toEqual(prepareAiContextDataset(
      validDataset,
      { contextMode: 'compact' },
      'Build a scheme',
      ['monitoring.main']
    ));
    expect(result.validation).toEqual({ allMatch: true, diagnostics: [] });
  });

  it('turns an LLM OID selection into a deterministic connected dataset', async() => {
    const send = jest.fn().mockResolvedValue(JSON.stringify({
      selected_oids: [
        'seaf.company.ta.services.monitorings.monitoring.main',
        'kb.main',
        'link.main',
        'network.main',
        'dc.main'
      ]
    }));
    const validate = jest.fn().mockResolvedValue({ valid: true, diagnostics: [] });

    const result = await generateValidatedDraft({
      prompt: 'Покажи monitoring.main и kb.main',
      currentDataset: validDataset,
      responseMode: 'selection',
      send,
      validate
    });

    expect(result.valid).toBe(true);
    expect(result.dataset['seaf.company.ta.services.monitorings']['monitoring.main']).toBeDefined();
    expect(result.dataset['seaf.company.ta.services.logical_links']['link.main']).toBeDefined();
    expect(result.dataset['seaf.company.ta.services.softwares']['jupiter.software.siem']).toBeDefined();
    expect(validate).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toContain('selected_oids');
  });

  it('ignores logical-link OIDs selected by the LLM and rebuilds links from the prompt scope', async() => {
    const source = logicalSelectionDataset({
      source: 'service.a', target: ['service.b'], direction: '==>'
    });
    const result = await generateValidatedDraft({
      prompt: 'Покажи service.a',
      currentDataset: source,
      responseMode: 'selection',
      send: jest.fn().mockResolvedValue(JSON.stringify({
        selected_oids: ['service.a', 'link.test']
      })),
      validate: jest.fn().mockResolvedValue({ valid: true, diagnostics: [] })
    });

    expect(result.valid).toBe(true);
    expect(result.dataset['seaf.company.ta.services.compute_services']['service.a']).toBeDefined();
    expect(result.dataset['seaf.company.ta.services.logical_links']).toBeUndefined();
  });

  it('completes endpoint selection and reconstructs only the logical link named by title', async() => {
    const source = logicalSelectionDataset({
      source: 'service.a', target: ['service.b'], direction: '==>'
    });
    source['seaf.company.ta.services.logical_links']['link.other'] = {
      title: 'Other link', source: 'service.a', target: ['service.c'], direction: '==>'
    };
    const send = jest.fn().mockResolvedValue(JSON.stringify({ selected_oids: ['service.a'] }));
    const result = await generateValidatedDraft({
      prompt: 'Покажи логическую связь Test link',
      currentDataset: source,
      responseMode: 'selection',
      send,
      validate: jest.fn().mockResolvedValue({ valid: true, diagnostics: [] })
    });

    expect(result.valid).toBe(true);
    expect(result.attempts).toHaveLength(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect(Object.keys(result.dataset['seaf.company.ta.services.logical_links'])).toEqual(['link.test']);
    expect(Object.keys(result.dataset['seaf.company.ta.services.compute_services']).sort())
      .toEqual(['service.a', 'service.b']);
  });

  it('deterministically completes a category selection that omitted requested monitoring or KB objects', async() => {
    const send = jest.fn().mockResolvedValue(JSON.stringify({ selected_oids: ['monitoring.main'] }));
    const validate = jest.fn().mockResolvedValue({ valid: true, diagnostics: [] });

    const result = await generateValidatedDraft({
      prompt: 'Оставь на схеме только сервисы мониторинга и средства КБ',
      currentDataset: validDataset,
      responseMode: 'selection',
      send,
      validate
    });

    expect(result.valid).toBe(true);
    expect(result.attempts).toHaveLength(1);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toContain('Каноническая интерпретация (обязательна)');
    expect(send.mock.calls[0][0]).toContain('seaf.company.ta.services.monitorings');
    expect(send.mock.calls[0][0]).toContain('seaf.company.ta.services.kbs');
    expect(send.mock.calls[0][0]).toContain('Обязательные OID прямых категорий');
    expect(send.mock.calls[0][0]).toContain('monitoring.main');
    expect(send.mock.calls[0][0]).toContain('kb.main');
    expect(result.dataset['seaf.company.ta.services.kbs']['kb.main']).toBeDefined();
  });

  it('deterministically completes a category selection that omitted Kubernetes objects', async() => {
    const source = structuredClone(validDataset);
    source['seaf.company.ta.services.k8s'] = {
      'k8s.main': {
        title: 'Kubernetes cluster',
        availabilityzone: ['az.main'],
        location: ['dc.main'],
        network_connection: ['network.main']
      }
    };
    const send = jest.fn().mockResolvedValue(JSON.stringify({ selected_oids: ['monitoring.main'] }));
    const validate = jest.fn().mockResolvedValue({ valid: true, diagnostics: [] });

    const result = await generateValidatedDraft({
      prompt: 'Оставь на схеме только сервисы мониторинга и kubernetes',
      currentDataset: source,
      responseMode: 'selection',
      send,
      validate
    });

    expect(result.valid).toBe(true);
    expect(result.attempts).toHaveLength(1);
    expect(send.mock.calls[0][0]).toContain('Kubernetes-кластеры [seaf.company.ta.services.k8s]');
    expect(result.dataset['seaf.company.ta.services.k8s']['k8s.main']).toBeDefined();
  });

  it('ignores non-drawable software selected by the LLM', async() => {
    const result = await generateValidatedDraft({
      prompt: 'Покажи monitoring.main',
      currentDataset: validDataset,
      responseMode: 'selection',
      send: jest.fn().mockResolvedValue(JSON.stringify({
        selected_oids: ['monitoring.main', 'jupiter.software.siem']
      })),
      validate: jest.fn().mockResolvedValue({ valid: true, diagnostics: [] })
    });

    expect(result.valid).toBe(true);
    expect(result.dataset['seaf.company.ta.services.monitorings']['monitoring.main']).toBeDefined();
    expect(result.dataset['seaf.company.ta.services.softwares']).toBeUndefined();
  });

  it('rejects an oversized current dataset before calling LLM', async() => {
    const send = jest.fn();
    await expect(generateValidatedDraft({
      prompt: 'Build a scheme',
      currentDataset: { oversized: 'x'.repeat(250001) },
      send,
      validate: jest.fn()
    })).rejects.toThrow('Текущий датасет длиннее');
    expect(send).not.toHaveBeenCalled();
  });
});
