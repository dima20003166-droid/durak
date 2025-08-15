import React from 'react';
import PropTypes from 'prop-types';

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={hasError:false,error:null}; }
  static getDerivedStateFromError(error){ return {hasError:true,error}; }
  componentDidCatch(error, info){ console.error('UI error:', error, info); }
  render(){
    if(this.state.hasError){
        return (
          <div className="min-h-screen flex items-center justify-center bg-bg text-danger p-6">
            <div className="bg-surface border border-danger rounded-xl p-6 max-w-lg text-center">
              <h2 className="text-2xl font-bold mb-2">Упс! Что-то пошло не так.</h2>
              <p className="text-sm opacity-80 mb-4">{String(this.state.error)}</p>
              <button className="px-4 py-2 bg-primary rounded-lg" onClick={()=>window.location.reload()}>Обновить страницу</button>
            </div>
          </div>
        );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};
