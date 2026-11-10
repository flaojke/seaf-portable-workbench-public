import { Root, createRoot } from 'react-dom/client';
import { App } from '../libCode/libCode.mjs';

export class ReactConnector {
  root: Root;

  constructor(el: HTMLElement) {
    this.root = createRoot(el);
  }

  render(schema: any) {
    (this.root.render as any)(<App schema={schema} />);
  }

  renderError(error: any) {
    (this.root.render as any)(<div>Something went wrong: {JSON.stringify(error)}</div>);
  }
}
