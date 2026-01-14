export function debounce(fn, wait, { leading = false, trailing = true, maxWait } = {}) {
  let timerId, lastArgs, lastThis, lastCallTime, lastInvokeTime = 0, result;
  const now = () => Date.now();

  const invoke = (time) => {
    lastInvokeTime = time;
    const r = fn.apply(lastThis, lastArgs);
    lastArgs = lastThis = undefined;
    result = r;
    return r;
  };

  const startTimer = (ms) => {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(timerExpired, ms);
  };

  const remainingWait = (time) => {
    const sinceLastCall   = time - lastCallTime;
    const sinceLastInvoke = time - lastInvokeTime;
    const timeWaiting     = wait - sinceLastCall;
    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - sinceLastInvoke)
      : timeWaiting;
  };

  const shouldInvoke = (time) => {
    if (lastCallTime === undefined) return true;
    const sinceLastCall   = time - lastCallTime;
    const sinceLastInvoke = time - lastInvokeTime;
    return (sinceLastCall >= wait) || (sinceLastCall < 0) ||
           (maxWait !== undefined && sinceLastInvoke >= maxWait);
  };

  const leadingEdge = (time) => {
    lastInvokeTime = time;
    startTimer(wait);
    return leading ? invoke(time) : undefined;
  };

  const trailingEdge = (time) => {
    timerId = undefined;
    if (trailing && lastArgs !== undefined) {
      return invoke(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  };

  const timerExpired = () => {
    const time = now();
    if (shouldInvoke(time)) return trailingEdge(time);
    startTimer(remainingWait(time));
  };

  function debounced(...args) {
    const time = now();
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (shouldInvoke(time)) {
      if (timerId === undefined) return leadingEdge(time);
      startTimer(remainingWait(time));
    }
	
	if (timerId === undefined) startTimer(wait);
	
    return result;
  }
  

  debounced.cancel = () => {
    if (timerId) clearTimeout(timerId);
    timerId = lastArgs = lastThis = lastCallTime = undefined;
    lastInvokeTime = 0;
  };

  debounced.flush = () => {
    if (timerId === undefined) return result;
    return trailingEdge(now());
  };

  return debounced;
}