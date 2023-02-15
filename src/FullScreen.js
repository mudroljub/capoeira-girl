class FullScreen extends HTMLElement {
  constructor() {
    super()
    this.addEventListener('click', this.toggle)
  }

  connectedCallback() {
    this.innerHTML = `
      <style>
        #ikonica {
          background: white;
          cursor: pointer;
          right: 10px;
          opacity: 0.75;
          padding: 4px;
          position: absolute;
          top: 10px;
          width: 32px;
          z-index: 1;
        }
      </style>
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA+AAAAPgBz8HmZQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFGSURBVFiF7ZcxbgIxEEVfwCAKmhQUkQIHSgEUJBJcgQOEhmOkT5GlyNJQUXEqqFCkpLA38lq212ZZQeEvWeuRNX/+2F57DPAb2NaEYx3K24ogbQQ3FwD2qdkDA+BRa70Izp7hO1CctljO9dkCnTqZKbSBzBOnZBwM+xsQNYILxeGLUTKeLWovnQlb5jkw9Al4cjjGinAF76gYXgEuglARVb5BAkCuX26MZwECviyZ6/uoJEAAK23wqPV/gLnqz4AzckNVIQdegS4y87ni0mOsLH5OCGTmkwififKp8wclJCQk/KMNfALTCJ8X5EFUeXc8AO+a/QGcNFsAG+TRegbegF0F5xh5HHfVd0H5KO4DS93BdxmZxcQll5FZ1Nz/ddxUQVJweAXYSrKikomFS8TIJ+DmRek1MjcRVZYX7S4eJmZLj9NG8AcRDQY6QwK5ggAAAABJRU5ErkJggg==" id="ikonica" width="32" alt="full screen" title="Full screen">
    `
  }

  toggle() {
    if (!document.fullscreenElement) document.body.requestFullscreen()
    else document.exitFullscreen()
  }
}

customElements.define('full-screen-btn', FullScreen)
