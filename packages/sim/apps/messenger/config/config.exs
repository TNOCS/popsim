# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
use Mix.Config

# This configuration is loaded before any dependency and is restricted
# to this project. If another project depends on this project, this
# file won't be loaded nor affect the parent project. For this reason,
# if you want to provide default values for your application for
# 3rd-party users, it should be done in your "mix.exs" file.

# You can configure your application as:
#
#     config :messenger, key: :value
#
# and access this configuration in your application as:
#
#     Application.get_env(:messenger, :key)
#
# You can also configure a 3rd-party app:
#
#     config :logger, level: :info
#

# It is also possible to import configuration files, relative to this
# directory. For example, you can emulate configuration per environment
# by uncommenting the line below and defining dev.exs, test.exs and such.
# Configuration from the imported file will override the ones defined
# here (which is why it is important to import them last).
#
#     import_config "#{Mix.env}.exs"
config :kaffe,
  consumer: [
    endpoints: [localhost: 9092], # [localhost: 9092], # that's [hostname: kafka_port]
    # topics: ["personsChannel"], # the topic(s) that will be consumed
    topics: ["personsChannel", "activitiesChannel", "simChannel"], # the topic(s) that will be consumed
    consumer_group: "connect-cluster", # the consumer group for tracking offsets in Kafka
    message_handler: Messenger.MessageProcessor, # the module from Step 1 that will process messages

    # optional
    async_message_ack: false, # see "async message acknowledgement" below
    start_with_earliest_message: true # default false
  ],
  producer: [
    endpoints: [localhost: 9092], # [hostname: port]
    topics: ["crowdChannel"],
    # optional
    partition_strategy: :md5
  ]