import assignSafe from '../util/assign-safe';
import protos from '../util/protos';

export default function prototype (opts) {
  let prototypes = protos(opts.prototype);
  return function (elem) {
    prototypes.forEach(function (proto) {
      if (!proto.isPrototypeOf(elem)) {
        assignSafe(elem, proto);
      }
    });
  };
}
