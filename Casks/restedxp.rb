cask "restedxp" do
  version "4.7.0"
  sha256 "2825e9f023655591da3fb3c899fd8abcc84f6496a1621407f624f258e13e03a6"

  url "https://github.com/RestedXP/RXPGuides/releases/download/v#{version}/RXPGuides-v#{version}-classic.zip"
  name "RestedXP"
  desc "RestedXP: WoW Classic leveling guides addon"
  homepage "https://github.com/RestedXP/RXPGuides"

  addon_dir = File.expand_path("/Applications/World of Warcraft/_classic_era_/Interface/AddOns")

  preflight do
    FileUtils.mkdir_p addon_dir unless Dir.exist?(addon_dir)
  end

  artifact "RXPGuides", target: "#{addon_dir}/RXPGuides"

  zap trash: [
    "#{addon_dir}/RXPGuides"
  ]
end
