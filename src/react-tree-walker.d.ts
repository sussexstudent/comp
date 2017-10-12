declare module 'react-tree-walker' {
  export default function walker(
    component: any,
    walker: (element: any, instance: any) => void
  ): Promise;
}
