// Stable service identifiers keep inquiry context independent of the UI language.
export const contactInterests = ['comprar', 'invertir', 'vender', 'relocation', 'otra', 'valorar'];

const serviceKeys = { comprar: 'buy', invertir: 'invest', vender: 'sell', valorar: 'value' };
export const getServiceKey = (service) => Object.hasOwn(serviceKeys, service) ? serviceKeys[service] : null;

export const projectFields = [
  { name: 'projectLocation', services: ['comprar', 'invertir', 'vender', 'valorar'] },
  { name: 'propertyType', services: ['comprar', 'invertir', 'vender', 'valorar'] },
  { name: 'budget', services: ['comprar', 'invertir'] },
  { name: 'area', services: ['comprar', 'invertir', 'vender', 'valorar'] },
  { name: 'rooms', services: ['comprar', 'vender', 'valorar'] },
  { name: 'investmentGoal', services: ['invertir'] },
];

export function getProjectLines(data, labels, service) {
  return projectFields
    .filter((field) => field.services.includes(service) && String(data.get(field.name) ?? '').trim())
    .map((field) => `${labels[field.name]}: ${String(data.get(field.name)).trim()}`);
}
