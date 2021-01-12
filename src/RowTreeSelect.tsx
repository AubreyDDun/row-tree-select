import {
  Vue,
  Prop,
  Component,
  Watch,
} from 'vue-property-decorator';
import {
  /* webpackPrefetch: true */
  Checkbox,
  Button,
  Empty,
  Spin,
  Tag,
} from 'ant-design-vue';

import {
  TreeNode,
  TreeNode4view,
} from './@types';

import styles from './RowTreeSelect.less';

// 是否显示选中结果
// 单选还是多选
// ✅可选范围：叶节点 | 所有节点
// ✅非叶节点是否可点击：是（选中其子节点） | 否，并展开子节点
// ✅显示范围：固定高度 | 无限制高度
// 数据是否来源异步
// ✅激活节点方式：hover | click

// 首先实现：仅叶节点可以选中的定高树
// 返回的节点标识：key

@Component
export default class RowTreeSelect extends Vue {
  @Prop({ type: Array, default: () => [] }) source!: TreeNode[];

  // 数据加载中
  @Prop({ type: Boolean, default: false }) sourceLoading!: boolean;

  // 非叶节点后面是否跟随checkbox
  @Prop({ type: Boolean, default: true }) onlyLeafCanBeSelected!: boolean;

  // 点击可选节点的非checkbox区域是否触发单选
  @Prop({ type: Boolean, default: false }) mixinRadioButton!: boolean;

  // hover是否激活切换
  @Prop({ type: Boolean, default: false }) switchByHover!: boolean;

  // height=0，不限高
  @Prop({ type: [String, Number], default: 300 }) height!: number | string;

  // 是否展示选择结果
  @Prop({ type: Boolean, default: true }) showResult!: boolean;

  // 是否展示选择结果
  @Prop({ type: Array, default: () => ['key'] }) emitFields!: (keyof TreeNode4view)[];

  treeNodes: TreeNode4view[] = [];

  selectedNodes: Array<TreeNode4view> = [];

  // 根据treeNodes上的active节点响应生成
  nodeColumns: Array<TreeNode4view[]> = [];

  lastActiveNode: TreeNode4view | null = null;

  get depth() {
    return this.getSourceDepth(this.source);
  }

  get treeHeight() {
    const { height } = this;
    if (!height) return 'none';
    if (typeof height === 'number' && height > 0) return `${height}px`;
    return height;
  }

  @Watch('source', { deep: true })
  onSourceChanged(source: TreeNode[]) {
    this.treeNodes = this.sourceInitHandler([
      ...source,
    ]);

    let activeNodeKeys = [] as Array<string | number>;
    if (this.selectedNodes.length) {
      let activeNode = this.lastActiveNode;
      if (!activeNode) [activeNode] = this.selectedNodes;
      activeNodeKeys = activeNode.parentKeys.concat(activeNode.key);
    }
    this.makeNodeActive(this.treeNodes, activeNodeKeys);

    const panels = [this.treeNodes];
    for (let depth = 1; depth <= this.depth; depth += 1) {
      if (panels[depth - 1]) {
        const activeNodes = panels[depth - 1].find((node: TreeNode4view) => node.active);
        if (activeNodes && activeNodes.children && activeNodes.children.length) {
          panels[depth] = activeNodes.children;
        }
      }
    }

    this.nodeColumns = panels;
  }

  @Watch('selectedNodes', { immediate: true })
  onSelectedNodesChanged(nodes: TreeNode4view[]) {
    const {
      emitFields: fields,
    } = this;
    let payload: ((string | number) | Record<keyof TreeNode4view, any>)[];
    if (fields.length === 1) {
      payload = nodes.map((node) => node[fields[0]]);
    } else {
      payload = nodes.map((node) => fields.reduce((cnt, field) => {
        cnt[field] = node[field];
        return cnt;
      }, {} as Record<keyof TreeNode4view, any>));
    }
    this.$emit('change', payload);
  }

  getSourceDepth(source: TreeNode[], parentDepth: number = 0): number {
    if (!source.length) return parentDepth;

    let depth = parentDepth + 1;
    const hasChildrenNodes = source.filter((node) => node.children && node.children.length);

    if (hasChildrenNodes.length) {
      depth = Math.max(
        ...hasChildrenNodes.map((node) => this.getSourceDepth(node.children as TreeNode[], depth)),
      );
    }
    return depth;
  }

  sourceInitHandler(
    source: TreeNode[],
    depth: number = 1,
    parentKeys: (string | number)[] = [],
  ): TreeNode4view[] {
    const treeNodes4view = source.map((node) => {
      const node4view = {
        ...node,
        leaf: !node.children || !node.children.length,
        selected: node.selected || false,
        active: false,
        depth,
        parentKeys,
      } as TreeNode4view;
      if (node.children && node.children.length) {
        node4view.children = this.sourceInitHandler(
          node.children as TreeNode[],
          depth + 1,
          parentKeys.concat([node.key]),
        );
      }

      const indexOfSelected = this.selectedNodes.findIndex((nd) => nd.key === node4view.key);
      if (node4view.selected) {
        if (indexOfSelected < 0) this.selectedNodes.push(node4view);
      } else if (indexOfSelected > -1) {
        this.selectedNodes.splice(indexOfSelected, 1);
      }

      return node4view;
    });

    return treeNodes4view;
  }

  makeNodeActive(nodes: TreeNode4view[], activeKeys: Array<string | number>) {
    if (!nodes.length) return;
    const [key, ...otherKeys] = activeKeys;
    const activeNode = (nodes.find((node) => node.key === key) as TreeNode4view) || nodes[0];
    activeNode.active = true;
    if (activeNode.children) {
      this.makeNodeActive(activeNode.children, otherKeys);
    }
  }

  onNodeHover(node: TreeNode4view) {
    if (this.switchByHover) this.nodeClickedHandler(node);
  }

  onCheckboxClick(event: Event) {
    event.stopPropagation();
  }

  onNodeClick(node: TreeNode4view) {
    if (this.mixinRadioButton && node.leaf) {
      this.radioBottonClickedHandler(node);
    } else {
      this.nodeClickedHandler(node, 'click');
    }
  }

  radioBottonClickedHandler(activeNode: TreeNode4view) {
    this.updateNodeState4radioChecked(activeNode);
    this.lastActiveNode = activeNode;
  }

  updateNodeState4radioChecked(activeNode: TreeNode4view) {
    if (this.onlyLeafCanBeSelected && !activeNode.leaf) return;

    if (
      activeNode.selected
      && activeNode.active
      && this.selectedNodes.length === 1
      && this.selectedNodes[0].key === activeNode.key
    ) {
      return;
    }

    const {
      key,
      depth,
      children,
    } = activeNode;
    this.nodeColumns[depth - 1].forEach((node) => {
      node.active = node.key === key;
      node.selected = node.key === key;
      return node;
    });
    if (children && children.length) {
      this.nodeColumns[depth] = children;
      const activeChild = children.find((child: TreeNode4view) => child.active) || children[0];
      this.updateNodeState4radioChecked(activeChild);
    } else {
      this.nodeColumns.splice(depth, this.nodeColumns.length - depth);
    }

    activeNode.selected = true;
    this.selectedNodes.forEach((node) => {
      this.$emit(node.key === key ? 'select' : 'unSelect', node);
    });
    this.selectedNodes = [activeNode];
    this.$emit('select', activeNode);
  }

  nodeClickedHandler(activeNode: TreeNode4view, event: string = 'hover') {
    this.updateNodesSelectedState(activeNode, event);
    this.updateNodesActiveState(activeNode);
    this.lastActiveNode = activeNode;
  }

  updateNodesSelectedState(activeNode: TreeNode4view, event: string = 'hover') {
    if (this.onlyLeafCanBeSelected && !activeNode.leaf) return;

    if (event === 'click') {
      activeNode.selected = !activeNode.selected;
      if (activeNode.selected) {
        this.selectedNodes = [...this.selectedNodes, activeNode];
      } else {
        const oldIndex = this.selectedNodes.findIndex((node) => node.key === activeNode.key);
        this.selectedNodes.splice(oldIndex, 1);
      }

      this.$emit(activeNode.selected ? 'select' : 'unSelect', activeNode);
    }
  }

  // TODO: 待优化，迭代改变节点状态的重复代码较多
  updateNodesActiveState(activeNode: TreeNode4view) {
    const {
      key,
      depth,
      children,
    } = activeNode;
    this.nodeColumns[depth - 1].forEach((node) => {
      node.active = node.key === key;
      return node;
    });
    if (children && children.length) {
      this.nodeColumns[depth] = children;
      const activeChild = children.find((child: TreeNode4view) => child.active) || children[0];
      this.updateNodesActiveState(activeChild);
    } else {
      this.nodeColumns.splice(depth, this.nodeColumns.length - depth);
    }
  }

  onCheckBoxChecked(node: TreeNode4view) {
    this.nodeClickedHandler(node, 'click');
  }

  onChecked4mixinRadioButton(e: Event, node: TreeNode4view) {
    e.stopPropagation();
    this.nodeClickedHandler(node, 'click');
  }

  protected render() {
    const nodeButton = (node: TreeNode4view) => {
      if (this.mixinRadioButton) {
        return <Button
          class={styles.customCheckboxButton}
          icon={node.selected ? 'minus' : 'plus'}
          size="small"
          shape="circle"
          type={!node.selected ? 'default' : 'primary'}
          onClick={(e: Event) => this.onChecked4mixinRadioButton(e, node)}
        />;
      }
      return <Checkbox
        checked={node.selected}
        onClick={this.onCheckboxClick}
        onChange={() => this.onCheckBoxChecked(node)}
      />;
    };

    const nodesPanel = (nodes: TreeNode4view[]) => (
      <ul
        class={styles.panel}
        style={{ width: `${100 / this.nodeColumns.length}%` }}
      >
        {
          nodes.map((node: TreeNode4view) => (
            <li
              class={[styles.node, node.active ? styles.active : '']}
              canBeSelected={node.leaf || !this.onlyLeafCanBeSelected}
              onClick={() => this.onNodeClick(node)}
              onMouseover={() => this.onNodeHover(node)}
            >
              <span class={styles.label}>
                {node.label}
              </span>
              {
                node.leaf || !this.onlyLeafCanBeSelected
                  ? nodeButton(node)
                  : null
              }
            </li>
          ))
        }
      </ul>
    );

    const cols = () => (
      <div
        class={styles.tree}
        style={{
          height: this.treeHeight,
        }}>
        { this.nodeColumns.map((nodes: TreeNode4view[]) => nodesPanel(nodes))}
      </div>
    );

    const result = () => {
      if (this.showResult) {
        return (
          <div class={styles.selected}>
            已选择：
            {
              this.selectedNodes.map((node) => (
                <Tag
                  closable
                  class={styles.tag}
                  key={node.key}
                  onClose={() => this.updateNodesSelectedState(node, 'click')}
                >
                  {node.label}
                </Tag>
              ))
            }
          </div>
        );
      }
      return null;
    };

    const content = this.source && this.source.length ? [result(), cols()] : <Empty />;

    return (
      <div class={styles.container}>
        {
          this.sourceLoading
            ? <Spin />
            : content
        }
      </div>
    );
  }
}
