"""
TensorFlow Federated (TFF) Reference Pipeline

Demonstrates official Google TensorFlow Federated implementation of FedAvg.
Note: TFF is designed for Linux / WSL2 environments due to native C++ Bazel kernels.

Usage in WSL2 / Ubuntu:
$ pip install tensorflow>=2.14.0 tensorflow-federated>=0.65.0
$ python tff_pipeline.py
"""

import os
import sys
import numpy as np
import pandas as pd
import collections

try:
    import tensorflow as tf
    import tensorflow_federated as tff
except ImportError:
    print("ℹ️ TensorFlow Federated (TFF) not installed in current environment.")
    print("To run TFF: Use WSL2 / Linux with Python 3.10/3.11 and run 'pip install tensorflow tensorflow-federated'.")

# Add parent directory for shared data preprocessing
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.preprocess import load_and_preprocess_data, partition_non_iid_hospitals

def make_federated_data(client_data, batch_size=16):
    """
    Converts NumPy hospital arrays into tf.data.Dataset generators required by TFF.
    """
    formatted_clients = []
    for hid, data in client_data.items():
        ds = tf.data.Dataset.from_tensor_slices(
            collections.OrderedDict(
                x=data["X"].astype(np.float32),
                y=data["y"].astype(np.int32)
            )
        )
        ds = ds.shuffle(buffer_size=100).batch(batch_size)
        formatted_clients.append(ds)
    return formatted_clients

def create_keras_model(input_dim):
    """Creates the standard Keras 2-layer classifier."""
    return tf.keras.models.Sequential([
        tf.keras.layers.Input(shape=(input_dim,)),
        tf.keras.layers.Dense(16, activation="relu"),
        tf.keras.layers.Dense(8, activation="relu"),
        tf.keras.layers.Dense(1, activation="sigmoid")
    ])

def model_fn(input_dim, sample_batch):
    """
    TFF Model Factory Function wrapping Keras model into tff.learning.models.VariableModel.
    """
    keras_model = create_keras_model(input_dim)
    return tff.learning.models.from_keras_model(
        keras_model=keras_model,
        input_spec=sample_batch.element_spec,
        loss=tf.keras.losses.BinaryCrossentropy(),
        metrics=[tf.keras.metrics.BinaryAccuracy(name="accuracy")]
    )

def run_tff_simulation(rounds=15):
    """
    Executes TFF simulation using build_weighted_fed_avg.
    """
    if "tff" not in globals():
        print("TFF simulation requires tensorflow_federated.")
        return

    # 1. Load Data
    X_train, X_test, y_train, y_test, X_train_df, X_test_df, feats, _ = load_and_preprocess_data()
    input_dim = X_train.shape[1]
    client_data = partition_non_iid_hospitals(X_train, y_train, X_train_df, n_clients=4)

    # 2. Format client datasets
    federated_train_data = make_federated_data(client_data)
    sample_batch = federated_train_data[0]

    # 3. Build TFF FedAvg Iterative Process
    trainer = tff.learning.algorithms.build_weighted_fed_avg(
        model_fn=lambda: model_fn(input_dim, sample_batch),
        client_optimizer_fn=lambda: tf.keras.optimizers.Adam(learning_rate=0.01),
        server_optimizer_fn=lambda: tf.keras.optimizers.SGD(learning_rate=1.0)
    )

    state = trainer.initialize()

    print("\n=======================================================")
    print("🚀 RUNNING TENSORFLOW FEDERATED (TFF) SIMULATION")
    print("=======================================================")

    for round_num in range(1, rounds + 1):
        result = trainer.next(state, federated_train_data)
        state = result.state
        metrics = result.metrics
        print(f"TFF Round {round_num:02d}/{rounds:02d} | "
              f"Train Loss: {metrics['client_work']['train']['loss']:.4f} | "
              f"Train Acc: {metrics['client_work']['train']['accuracy']*100:.2f}%")

    print("=======================================================\n")

if __name__ == "__main__":
    run_tff_simulation()
