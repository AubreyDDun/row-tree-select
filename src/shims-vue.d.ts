import Vue from 'vue';

declare module '*.vue' {
  export default Vue;
}

// 需要定义，否则会报props传值的错
declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    [propsName: string]: any;
    ref?: string;
  }
}
