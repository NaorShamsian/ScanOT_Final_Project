
import React from 'react'
type Props={children:React.ReactNode}; type State={hasError:boolean}
export default class ErrorBoundary extends React.Component<Props,State>{
  state:State={hasError:false}
  static getDerivedStateFromError(){return {hasError:true}}
  componentDidCatch(err:any){console.error(err)}
  render(){ return this.state.hasError? <div className='container'><div className='card'>Something went wrong.</div></div> : this.props.children }
}
