import type { LineItem, ServiceDocument } from '../models';
import type { ItemPlan } from './data/documents';
import type { DemoServiceKey } from './data/services';

/** Line items as a user would enter them; amounts and totals are left to the model hooks. */
export function buildLineItems(
  plans: readonly ItemPlan[],
  services: Record<DemoServiceKey, ServiceDocument>,
): Omit<LineItem, 'amount'>[] {
  return plans.map((plan) => {
    if (!('service' in plan)) return plan;
    const service = services[plan.service];
    return {
      serviceId: service._id,
      name: service.name,
      description: service.description,
      unit: service.unit,
      unitPrice: service.price,
      quantity: plan.quantity,
    };
  });
}
