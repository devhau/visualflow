export const LOG = (message?: any, ...optionalParams: any[]) => console.log(message, optionalParams);
export const getDate = () => (new Date());
export const getTime = () => getDate().getTime();
export const getNameTime = (name: string) => `${name}${getDate().getTime().toString().substring(5)}`;
export const getUuid = () => {
  // http://www.ietf.org/rfc/rfc4122.txt
  let s: any = [];
  let hexDigits = "0123456789abcdef";
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = "-";

  let uuid = s.join("");
  return uuid;
}

export const compareSort = (a: any, b: any) => {
  if (a.sort < b.sort) {
    return -1;
  }
  if (a.sort > b.sort) {
    return 1;
  }
  return 0;
}
export const isFunction = (fn: any) => {
  return fn && fn instanceof Function;
}
export const downloadObjectAsJson = (exportObj: any, exportName: string) => {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}
export const readFileLocal = (callback: any) => {
  var inputEl = document.createElement('input');
  inputEl.setAttribute('type', 'file');
  inputEl.addEventListener('change', function () {
    var fr = new FileReader();
    fr.onload = function () {
      callback?.(fr.result);
    }
    if (inputEl && inputEl.files)
      fr.readAsText(inputEl.files[0]);
  });
  document.body.appendChild(inputEl);
  inputEl.click();
  inputEl.remove();
}
