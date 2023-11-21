import React from 'react';

import * as storage from '../../util/storage'
import * as url from '../../util/url'
import * as api from '../../api'
import ListReport from './../reports/list'
import { VISITORS_METRIC, PAGENAME_METRIC, PAGEVIEW_METRIC, maybeWithCR } from './../reports/metrics';

function EntryPages({ query, site }) {
  function fetchData() {
    return api.get(url.apiPath(site, '/entry-pages'), query, { limit: 9 })
  }

  function externalLinkDest(page) {
    return url.externalLinkForPage(site.domain, page.name)
  }

  function getFilterFor(listItem) {
    return { entry_page: listItem['name'] }
  }

  return (
    <ListReport
      fetchData={fetchData}
      getFilterFor={getFilterFor}
      keyLabel="URL"
      metrics={maybeWithCR([{ ...VISITORS_METRIC, label: 'Unique Entrances' }], query)}
      detailsLink={url.sitePath(site, '/entry-pages')}
      query={query}
      externalLinkDest={externalLinkDest}
      color="bg-orange-50"
    />
  )
}

function ExitPages({ query, site }) {
  function fetchData() {
    return api.get(url.apiPath(site, '/exit-pages'), query, { limit: 9 })
  }

  function externalLinkDest(page) {
    return url.externalLinkForPage(site.domain, page.name)
  }

  function getFilterFor(listItem) {
    return { exit_page: listItem['name'] }
  }

  return (
    <ListReport
      fetchData={fetchData}
      getFilterFor={getFilterFor}
      keyLabel="URL"
      metrics={maybeWithCR([{ ...VISITORS_METRIC, label: "Unique Exits" }], query)}
      detailsLink={url.sitePath(site, '/exit-pages')}
      query={query}
      externalLinkDest={externalLinkDest}
      color="bg-orange-50"
    />
  )
}

function TopPages({ query, site, isSmallModal }) {
  function fetchData() {
    return api.get(url.apiPath(site, '/pages'), query, { limit: 30 })
  }

  function externalLinkDest(page) {
    return url.externalLinkForPage(site.domain, page.name)
  }

  function getFilterFor(listItem) {
    return { page: listItem['name'] }
  }
  function getMetricsForPage(){
    let metrics;
    if (!isSmallModal){
        metrics = [PAGENAME_METRIC, VISITORS_METRIC];
    }else{
        metrics = [VISITORS_METRIC];
    }
    return metrics;
  }
  return (
    <ListReport
      fetchData={fetchData}
      getFilterFor={getFilterFor}
      keyLabel="URL"
      metrics={maybeWithCR(getMetricsForPage(), query)}
      detailsLink={url.sitePath(site, '/pages')}
      query={query}
      externalLinkDest={externalLinkDest}
      color="bg-orange-50"
      colMinWidth={200}
    />
  )
}

const labelFor = {
  'pages': 'Top Pages',
  'entry-pages': 'Entry Pages',
  'exit-pages': 'Exit Pages',
}

const labelForTranslated = {
    'pages': 'Páginas em Alta',
    'entry-pages': 'Páginas de Entrada',
    'exit-pages': 'Páginas de Saída',
}

export default class Pages extends React.Component {
  constructor(props) {
    super(props)
    this.tabKey = `pageTab__${props.site.domain}`
    const storedTab = storage.getItem(this.tabKey)
    this.state = {
      mode: storedTab || 'pages'
    }
  }

  setMode(mode) {
    return () => {
      storage.setItem(this.tabKey, mode)
      this.setState({ mode })
    }
  }

  renderContent() {
    switch (this.state.mode) {
      case "entry-pages":
        return <EntryPages site={this.props.site} query={this.props.query} />
      case "exit-pages":
        return <ExitPages site={this.props.site} query={this.props.query} />
      case "pages":
      default:
        return <TopPages site={this.props.site} query={this.props.query} isSmallModal={this.props.isSmallModal} />
    }
  }


  renderPill(name, mode) {
    const isActive = this.state.mode === mode

    if (isActive) {
      return (
        <button
          className="inline-block h-5 text-indigo-700 dark:text-indigo-500 font-bold active-prop-heading"
        >
          {name}
        </button>
      )
    }

    return (
      <button
        className="hover:text-indigo-600 cursor-pointer"
        onClick={this.setMode(mode)}
      >
        {name}
      </button>
    )
  }

  render() {
    return (
      <div>
        {/* Header Container */}
        <div className="w-full flex justify-between">
          <h3 className="font-bold dark:text-gray-100">
            {labelForTranslated[this.state.mode] || 'Page Visits'}
          </h3>
          <div className="flex font-medium text-xs text-gray-500 dark:text-gray-400 space-x-2">
            {this.renderPill('Em Alta', 'pages')}
            {this.renderPill('Páginas de Entrada', 'entry-pages')}
            {this.renderPill('Páginas de Saída', 'exit-pages')}
          </div>
        </div>
        {/* Main Contents */}
        {this.renderContent()}
      </div>
    )
  }
}
