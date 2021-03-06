export const NO_VMS_MATCH_THIS_PATTERN = 'no VMs match this pattern'
export const UNHEALTHY_VDI_CHAIN_ERROR = 'unhealthy VDI chain'
const NO_SUCH_OBJECT_ERROR = 'no such object'

export const isSkippedError = error =>
  error.message === UNHEALTHY_VDI_CHAIN_ERROR ||
  error.message === NO_SUCH_OBJECT_ERROR
