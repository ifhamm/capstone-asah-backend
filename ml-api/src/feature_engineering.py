import pandas as pd
import numpy as np

class FeatureEngineer:
    """
    Feature Engineering untuk Bank Marketing
    Menghasilkan 25 features baru dari 16 features original
    """
    def __init__(self):
        pass
    def normalize_keys_to_underscore(self, df):
        # Rename columns with dot to underscore for internal processing
        df = df.rename(columns=lambda x: x.replace('.', '_'))
        return df
    
    def normalize_keys_to_dot(self, df):
        # Rename specific columns back to dot notation for preprocessor compatibility
        key_mapping = {
            'emp_var_rate': 'emp.var.rate',
            'cons_price_idx': 'cons.price.idx',
            'cons_conf_idx': 'cons.conf.idx',
            'nr_employed': 'nr.employed'
        }
        df = df.rename(columns=key_mapping)
        return df
    def create_age_features(self, df):
        df['is_senior'] = (df['age'] >= 60).astype(int)
        df['is_young'] = (df['age'] <= 30).astype(int)
        df['age_squared'] = df['age'] ** 2
        df['age_bin'] = pd.cut(df['age'], bins=[0, 30, 40, 50, 60, 100], labels=[1, 2, 3, 4, 5]).astype(int)
        return df
    def create_campaign_features(self, df):
        df['single_call'] = (df['campaign'] == 1).astype(int)
        df['high_campaign'] = (df['campaign'] > 5).astype(int)
        return df
    def create_economic_features(self, df):
        df['euribor_low'] = (df['euribor3m'] < 1).astype(int)
        df['euribor_high'] = (df['euribor3m'] > 4).astype(int)
        df['confidence_low'] = (df['cons_conf_idx'] < -40).astype(int)
        df['confidence_high'] = (df['cons_conf_idx'] > -30).astype(int)
        return df
    def create_interaction_features(self, df):
        df['campaign_x_empvar'] = df['campaign'] * df['emp_var_rate']
        df['euribor_x_confidence'] = df['euribor3m'] * df['cons_conf_idx']
        df['euribor_x_price'] = df['euribor3m'] * df['cons_price_idx']
        df['empvar_x_employed'] = df['emp_var_rate'] * df['nr_employed']
        df['age_x_campaign'] = df['age'] * df['campaign']
        df['age_x_empvar'] = df['age'] * df['emp_var_rate']
        df['campaign_x_confidence'] = df['campaign'] * df['cons_conf_idx']
        df['euribor_x_employed'] = df['euribor3m'] * df['nr_employed']
        df['price_x_confidence'] = df['cons_price_idx'] * df['cons_conf_idx']
        df['empvar_x_confidence'] = df['emp_var_rate'] * df['cons_conf_idx']
        return df
    def create_ratio_features(self, df):
        df['economic_ratio'] = df['euribor3m'] / (df['cons_conf_idx'].abs() + 1)
        df['employment_ratio'] = df['emp_var_rate'] / (df['nr_employed'] / 1000)
        df['price_per_confidence'] = df['cons_price_idx'] / (df['cons_conf_idx'].abs() + 1)
        df['campaign_intensity'] = df['campaign'] / (df['age'] + 1)
        df['euribor_per_employed'] = df['euribor3m'] / (df['nr_employed'] / 1000)
        return df
    def engineer_features(self, df):
        df = df.copy()
        # Step 1: Normalize to underscore for internal feature engineering
        df = self.normalize_keys_to_underscore(df)
        df = self.create_age_features(df)
        df = self.create_campaign_features(df)
        df = self.create_economic_features(df)
        df = self.create_interaction_features(df)
        df = self.create_ratio_features(df)
        # Step 2: Convert back to dot notation for preprocessor compatibility
        df = self.normalize_keys_to_dot(df)
        return df
