import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosResponse } from 'axios';

import { RequestWithBenefits } from '@back/controllers/gigachat';
import { GigaChatClientConfig } from 'gigachat';

import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
const logger = getLoggerWithTag('b/h/g/requestAiGena');

const SEAF_EMAIL = 'seaf@sber.ru';
const REQUEST_PATH = 'predict';
const AGENT_NAME = 'dzo-standards';

const systemCi = process.env.VUE_APP_DOCHUB_CI;
const systemName = process.env.VUE_APP_DOCHUB_TITLE ?? 'SEAF';

type TMessageResponse = {
  messageID: string;
  chatID: string;
  msgText: string;
  parameters?: {
    type: string;
    guid: string;
    name: string;
  };
};

export async function requestAiGena(
  message: string,
  request: RequestWithBenefits,
  config: GigaChatClientConfig
) {
  if(typeof systemCi !== 'string') {
    throw new Error('System CI no found! Check env var "VUE_APP_DOCHUB_CI".');
  }

  const jwtToken = request?.tokenPayload?.payloadObj;
  if (!jwtToken) {
    throw new Error('JWT not found. Authorization is required.');
  }

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'x-client-id': systemCi,                // CI сервиса отправляющего запрос
    'x-session-id': uuidv4(),               // Уникальный идентификатор сессии
    'x-request-id': uuidv4()                // Уникальный идентификатор запроса
  };

  let userName = `${jwtToken.surname} ${jwtToken.name}`;
  if (typeof jwtToken?.patronymic === 'string') {
    userName += ` ${jwtToken?.patronymic}`;
  }

  const body = {
    message: message,
    system: {
      ci: systemCi,                                       // КЭ системы, отправившей запрос (CI)
      system_name: systemName,                            // Название системы, отправившей запрос
      agent: AGENT_NAME                                   // Наименование агента (опционально)
    },
    user: {
      name: userName,                                     // Имя пользователя
      preferred_username: jwtToken.sub,                   // Логин пользователя (только буквы и цифры)
      personal_number: jwtToken.empId ?? jwtToken.sub,    // Табельный номер пользователя
      email: jwtToken?.email ?? SEAF_EMAIL                // Email пользователя
    },
    guid: jwtToken.sub                                    // Уникальный идентификатор пользователя
  };

  logger.debug(() => [{ title: 'Request to AiGenA', obj: body }]);

  const response: AxiosResponse<TMessageResponse, any> = await axios({
    method: 'POST',
    headers,
    url: `${process.env.VUE_APP_AIGENA_API}/${REQUEST_PATH}`,
    data: body,
    httpsAgent: config.httpsAgent
  });

  return response;
}
