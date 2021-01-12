export interface TreeNode {
  value: any;
  key: string | number;
  label: string | number;
  selected?: boolean;
  children?: TreeNode[];
  remark?: string;
}

export interface TreeNode4view {
  value: any;
  key: string | number;
  label: string | number;
  children?: TreeNode4view[];
  remark?: string;
  parentKeys: (string | number)[];
  selected: boolean;
  active: boolean;
  leaf: boolean;
  depth: number;
}
