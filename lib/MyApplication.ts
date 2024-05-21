import { Backend } from "kuzzle";
import { PrometheusPlugin } from "kuzzle-plugin-prometheus";
import PluginPassportOAuth from "kuzzle-plugin-auth-passport-oauth";
import { HermesMessengerPlugin } from "kuzzle-plugin-hermes-messenger";

export type MyApplicationConfig = {
	hostAddress: string 
};

export class MyApplication extends Backend {
  public configuration: MyApplicationConfig;
  private prometheusPlugin = new PrometheusPlugin();
  private passportOauthPlugin = new PluginPassportOAuth();
  private hermesMessengerPlugin = new HermesMessengerPlugin();
  
  get appConfig() {
    return this.config.content.application as MyApplicationConfig;
  }

  constructor(config?: MyApplicationConfig) {
    super("my-application");

    if (config) {
      this.configuration = config;
    } else {
      this.configuration = this.config.content
        .application as MyApplicationConfig;
    }

    this.plugin.use(this.prometheusPlugin);
    this.plugin.use(this.passportOauthPlugin);
    this.plugin.use(this.hermesMessengerPlugin);
  }

  async start() {
    await super.start();

    this.log.info("Application started");
  }

  async configureSmtp(config) {
    console.log(config);
    await this.sdk.query({
      account: config.account,
      action: "addAccount",
      body: {
        defaultSender: config.defaultSender,
        host: config.host,
        pass: config.pass,
        port: 465,
        user: config.user,
      },
      controller: "hermes/smtp",
    });
  }
}
