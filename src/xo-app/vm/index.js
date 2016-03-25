import _ from 'messages'
import React, { Component } from 'react'
import xo from 'xo'
import { Row, Col } from 'grid'
import CopyToClipboard from 'react-copy-to-clipboard'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import {
  connectStore,
  Debug,
  formatSize,
  normalizeXenToolsStatus,
  osFamily
} from 'utils'
import map from 'lodash/map'
import { FormattedRelative } from 'react-intl'
import {
  CpuSparkLines,
  MemorySparkLines,
  VifSparkLines,
  XvdSparkLines
} from 'xo-sparklines'

import VmActionBar from './action-bar'

// ===================================================================

@connectStore((state, props) => {
  const { objects } = state
  const { id } = props.params

  const vm = objects[id]
  if (!vm) {
    return {}
  }

  return {
    container: objects[vm.$container],
    pool: objects[vm.$pool],
    vm
  }
})

export default class Vm extends Component {
  componentWillMount () {
    const vmId = this.props.params.id
    const loop = () => {
      xo.call('vm.stats', { id: vmId }).then((newStats) => {
        this.setState({
          stats: newStats.stats
        })
      })

      this.timeout = setTimeout(loop, 5000)
    }

    loop()
  }

  componentWillUnmount () {
    clearTimeout(this.timeout)
  }

  render () {
    const {
      container,
      pool,
      vm
    } = this.props

    const { stats } = this.state || {}

    if (!vm) {
      return <h1>Loading…</h1>
    }

    return <div>
      <Row>
        <Col size={6}>
          <h1>
            {vm.name_label}
            <small className='text-muted'> - {container.name_label} ({pool.name_label})</small>
          </h1>
          <p className='lead'>{vm.name_description}</p>
        </Col>
        <Col size={6}>
          <div className='pull-xs-right'>
            <VmActionBar vm={vm} handlers={this.props}/>
          </div>
        </Col>
      </Row>
      <Tabs>
        <TabList>
          <Tab>{_('generalTabName')}</Tab>
          <Tab>{_('statsTabName')}</Tab>
          <Tab>{_('consoleTabName')}</Tab>
          <Tab>{_('disksTabName', { disks: vm.$VBDs.length })}</Tab>
          <Tab>{_('networkTabName')}</Tab>
          <Tab>{_('snapshotsTabName')}</Tab>
          <Tab>{_('logsTabName')}</Tab>
          <Tab>{_('advancedTabName')}</Tab>
        </TabList>
        <TabPanel>
          { /* TODO: use CSS style */ }
          <br/>
          <Row className='text-xs-center'>
            <Col size={3}>
              <h2>{vm.CPUs.number}x <i className='xo-icon-cpu fa-lg'></i></h2>
              {stats && <CpuSparkLines data={stats.cpus} />}
            </Col>
            <Col size={3}>
              { /* TODO: compute nicely RAM units */ }
              <h2>{formatSize(vm.memory.size)} <i className='xo-icon-memory fa-lg'></i></h2>
              {stats && <MemorySparkLines data={stats} />}
            </Col>
            <Col size={3}>
              { /* TODO: compute total disk usage */ }
              <h2>{vm.$VBDs.length}x <i className='xo-icon-disk fa-lg'></i></h2>
              {stats && <XvdSparkLines data={stats.xvds} />}
            </Col>
            <Col size={3}>
              <h2>{vm.VIFs.length}x <i className='xo-icon-network fa-lg'></i></h2>
              {stats && <VifSparkLines data={stats.vifs} />}
            </Col>
          </Row>
          { /* TODO: use CSS style */ }
          <br/>
          {vm.xenTools
            ? <Row className='text-xs-center'>
              <Col size={3}>
                {vm.power_state === 'Running'
                  ? <div>
                    <p className='text-xs-center'>{_('started')} <FormattedRelative value={vm.startTime * 1000}/></p>
                  </div>
                  : null
                }
              </Col>
              <Col size={3}>
                <p className='copy-to-clipboard'>
                  {vm.addresses['0/ip']
                    ? <div> {vm.addresses['0/ip']}</div>
                    : _('noIpv4Record')
                  }
                </p>
              </Col>
              <Col size={3}>
                <p>
                  {vm.virtualizationMode === 'pv'
                    ? <div>Paravirtualized (PV)</div>
                    : 'Hardware-assisted virtualizion (HVM)'
                  }
                </p>
              </Col>
              <Col size={3}>
                { /* TODO: tooltip and better icon usage */ }
                <h1><i className={'icon-' + osFamily(vm.os_version.distro)} /></h1>
              </Col>
            </Row>
            : <Row className='text-xs-center'>
              <Col size={12}><em>{_('noToolsDetected')}.</em></Col>
            </Row>
          }
          { /* TODO: use CSS style */ }
          <br/>
          <Row>
            <Col size={12}>
              { /* TODO: tag display component */ }
            </Col>
          </Row>
        </TabPanel>
        <TabPanel>
          <Debug value={this.state} />
        </TabPanel>
        <TabPanel>
          <h2>noVNC stuff</h2>
        </TabPanel>
        <TabPanel>
          <Debug value={vm} />
        </TabPanel>
        <TabPanel>
          <Row>
            <Col size={12}>
              {map(vm.VIFs, (vif) => <p>{vif}</p>)}
            </Col>
          </Row>
        </TabPanel>
        <TabPanel>
          <div className='col-md-6'>
            <h2>Snapshot stuff</h2>
          </div>
        </TabPanel>
        <TabPanel>
          <div className='col-md-6'>
            <h2>Log stuff</h2>
          </div>
        </TabPanel>
        <TabPanel>
          <Row>
            <Col size={12}>
              <dl className='dl-horizontal'>
                <dt className='col-md-3'>{_('uuid')}</dt>
                <dd className='col-md-9 copy-to-clipboard'>
                  {vm.uuid}&nbsp;
                  <CopyToClipboard text={vm.uuid}>
                    <button className='btn btn-sm btn-secondary btn-copy-to-clipboard'>
                      <i className='xo-icon-clipboard'></i>
                    </button>
                  </CopyToClipboard>
                </dd>

                <dt className='col-md-3'>{_('virtualizationMode')}</dt>
                <dd className='col-md-9'>{vm.virtualizationMode}</dd>

                <dt className='col-md-3'>{_('cpuWeightLabel')}</dt>
                {vm.cpuWeight
                  ? <div>
                    <dd className='col-md-9'>{vm.cpuWeight}</dd>
                  </div>
                  : <div>
                    <dd className='col-md-9'>{_('defaultCpuWeight')}</dd>
                  </div>
                }

                {vm.PV_args
                  ? <div>
                    <dt className='col-md-3'>{_('pvArgsLabel')}</dt>
                    <dd className='col-md-9'>{vm.PV_args}</dd>
                  </div>
                  : null
                }

                <dt className='col-md-3'>{_('xenToolsStatus')}</dt>
                <dd className='col-md-9'>{_('xenToolsStatusValue', { status: normalizeXenToolsStatus(vm.xenTools) })}</dd>

                <dt className='col-md-3'>{_('osName')}</dt>
                <dd className='col-md-9'>{vm.os_version ? vm.os_version.name : _('unknownOsName')}</dd>

                <dt className='col-md-3'>{_('osKernel')}</dt>
                <dd className='col-md-9'>{vm.os_version ? vm.os_version.uname : _('unknownOsKernel')}</dd>

                <dt className='col-md-3'>{_('autoPowerOn')}</dt>
                <dd className='col-md-9'>{vm.auto_poweron ? _('enabledAutoPowerOn') : _('disabledAutoPowerOn')}</dd>

                <dt className='col-md-3'>{_('ha')}</dt>
                <dd className='col-md-9'>{vm.high_availability ? _('enabledHa') : _('disabledHa')}</dd>

                <dt className='col-md-3'>{_('originalTemplate')}</dt>
                <dd className='col-md-9'>{vm.other.base_template_name ? vm.other.base_template_name : _('unknownOriginalTemplate')}</dd>
              </dl>
            </Col>
          </Row>
        </TabPanel>
      </Tabs>
    </div>
  }
}
