import {SDK} from "./sdk";
import Tracker from "./tracker";





export default {
    install: SDK.install,
    uninstall: SDK.uninstall,
    get tracker() {
        const tracker: Tracker = SDK.singleton.getTracker();

        return {
            enable: tracker.start,
            disable: tracker.stop,
        };
    }
};