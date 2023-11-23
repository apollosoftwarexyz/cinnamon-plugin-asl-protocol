import Cinnamon, { CinnamonPlugin, CinnamonHookConsumer } from '@apollosoftwarexyz/cinnamon';
export declare const ASW_PROTOCOL_VERSION = 2;
export declare class ApolloProtocol extends CinnamonPlugin implements CinnamonHookConsumer {
    constructor(framework: Cinnamon, options?: {});
    onInitialize(): Promise<boolean>;
    beforeRegisterControllers(): Promise<void>;
}
