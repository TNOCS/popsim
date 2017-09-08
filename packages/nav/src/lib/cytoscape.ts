import { ICytoscapeElement } from './cytoscape';
export interface ICytoscapeElement {
  /**
   * 'nodes' for a node, 'edges' for an edge
   *
   * @type {('nodes' | 'edges')}
   * @memberof ICytoscapeElement
   */
  group: 'nodes' | 'edges';
  /**
   * Element data (put json serialisable dev data here)
   *
   * @type {{
   *     id: string;
   *     parent?: string;
   *   }}
   * @memberof ICytoscapeElement
   */
  data: {
    id: string;
    parent?: string;
    [key: string]: any;
  };
}

export interface ICytoscapeNodeElement extends ICytoscapeElement {
  group: 'nodes';
  /**
   * The model position of the node
   *
   * @type {{
   *     x: number;
   *     y: number;
   *   }}
   * @memberof ICytoscapeElement
   */
  position: {
    x: number;
    y: number;
  };
}

export interface ICytoscapeEdgeElement extends ICytoscapeElement {
  group: 'edges';
  data: {
    id: string;
    [key: string]: any;
    /**
     * The source node id (edge comes from this node)
     *
     * @type {string}
     */
    source: string;
    /**
     * The target node id (edge goes to this node)
     *
     * @type {string}
     */
    target: string;
  };
}
