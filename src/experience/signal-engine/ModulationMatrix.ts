import { Saturation, type SaturationSettings } from './Saturation';

export interface ModulationTarget {
  id: string;
  base: number;
  minimum: number;
  maximum: number;
  saturation?: SaturationSettings;
}

export interface ModulationRoute {
  source: string;
  target: string;
  amount: number;
  mode?: 'add' | 'multiply';
}

export class ModulationMatrix {
  private readonly targetsById: Map<string, ModulationTarget>;
  private readonly routesByTarget: Map<string, ModulationRoute[]>;

  constructor(
    targets: ModulationTarget[],
    routes: ModulationRoute[],
    private readonly saturation: SaturationSettings,
  ) {
    this.targetsById = new Map(targets.map((target) => [target.id, target]));
    if (this.targetsById.size !== targets.length) throw new Error('Modulation target IDs must be unique.');
    this.routesByTarget = new Map(targets.map(({ id }) => [id, []]));
    for (const route of routes) {
      const targetRoutes = this.routesByTarget.get(route.target);
      if (!targetRoutes) throw new Error(`Unknown modulation target: ${route.target}`);
      targetRoutes.push(route);
    }
  }

  evaluate(signals: Readonly<Record<string, number>>): Record<string, number> {
    return Object.fromEntries(
      [...this.targetsById.keys()].map((id) => [id, this.evaluateTarget(id, signals)]),
    );
  }

  evaluateTarget(
    id: string,
    signals: Readonly<Record<string, number>>,
    overrides: Readonly<Record<string, number>> = {},
  ): number {
    const target = this.targetsById.get(id);
    const routes = this.routesByTarget.get(id);
    if (!target || !routes) throw new Error(`Unknown modulation target: ${id}`);

    let value = target.base;
    for (const route of routes) {
      const signal = overrides[route.source] ?? signals[route.source];
      if (signal === undefined) throw new Error(`Unknown modulation source: ${route.source}`);
      value = route.mode === 'multiply'
        ? value * (1 + signal * route.amount)
        : value + signal * route.amount;
    }

    return Saturation.process(
      value,
      target.saturation ?? this.saturation,
      target.minimum,
      target.maximum,
    );
  }
}
